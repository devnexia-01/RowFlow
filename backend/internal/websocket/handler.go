package websocket

import (
        "encoding/json"
        "log"
        "sync"
        "time"

        "github.com/google/uuid"
        "github.com/gorilla/websocket"
        "github.com/fourinrow/backend/internal/bot"
        "github.com/fourinrow/backend/internal/database"
        "github.com/fourinrow/backend/internal/game"
        "github.com/fourinrow/backend/internal/kafka"
        "github.com/fourinrow/backend/internal/matchmaking"
)

type Client struct {
        ID       string
        Username string
        Conn     *websocket.Conn
        GameID   string
        mu       sync.Mutex
}

type GameSession struct {
        ID              string
        Player1         *Client
        Player2         *Client
        Bot             *bot.Bot
        Board           *game.Board
        LastActivity    time.Time
        DisconnectedPlayer string
        DisconnectTime  time.Time
        mu              sync.RWMutex
}

type Hub struct {
        clients      map[string]*Client
        games        map[string]*GameSession
        matchmaker   *matchmaking.Matchmaker
        db           *database.DB
        kafkaProducer *kafka.Producer
        mu           sync.RWMutex
}

type Message struct {
        Type     string                 `json:"type"`
        Data     map[string]interface{} `json:"data,omitempty"`
        Error    string                 `json:"error,omitempty"`
}

func NewHub(db *database.DB, kafkaProducer *kafka.Producer) *Hub {
        return &Hub{
                clients:      make(map[string]*Client),
                games:        make(map[string]*GameSession),
                matchmaker:   matchmaking.NewMatchmaker(),
                db:           db,
                kafkaProducer: kafkaProducer,
        }
}

func (h *Hub) HandleClient(conn *websocket.Conn) {
        client := &Client{
                ID:   uuid.New().String(),
                Conn: conn,
        }

        defer func() {
                h.removeClient(client)
                conn.Close()
        }()

        for {
                var msg Message
                err := conn.ReadJSON(&msg)
                if err != nil {
                        if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                                log.Printf("WebSocket error: %v", err)
                        }
                        h.handleDisconnect(client)
                        break
                }

                h.handleMessage(client, msg)
        }
}

func (h *Hub) handleMessage(client *Client, msg Message) {
        switch msg.Type {
        case "join":
                username, ok := msg.Data["username"].(string)
                if !ok || username == "" {
                        client.sendError("Invalid username")
                        return
                }
                h.handleJoin(client, username)

        case "move":
                column, ok := msg.Data["column"].(float64)
                if !ok {
                        client.sendError("Invalid column")
                        return
                }
                h.handleMove(client, int(column))

        case "reconnect":
                gameID, ok := msg.Data["gameId"].(string)
                if !ok {
                        client.sendError("Invalid game ID")
                        return
                }
                h.handleReconnect(client, gameID)
        }
}

func (h *Hub) handleJoin(client *Client, username string) {
        client.Username = username
        h.mu.Lock()
        h.clients[client.ID] = client
        h.mu.Unlock()

        if err := h.db.EnsurePlayer(username); err != nil {
                log.Printf("Error ensuring player: %v", err)
        }

        player := &matchmaking.Player{
                ID:       client.ID,
                Username: username,
                Conn:     client.Conn,
                JoinedAt: time.Now(),
        }

        h.matchmaker.AddPlayer(player)
        client.send(Message{Type: "waiting", Data: map[string]interface{}{"message": "Waiting for opponent..."}})

        go h.tryMatchmaking(client)
}

func (h *Hub) tryMatchmaking(client *Client) {
        time.Sleep(10 * time.Second)

        opponent, needsBot := h.matchmaker.FindMatch(client.ID)
        
        if !needsBot && opponent == nil {
                return
        }

        gameID := uuid.New().String()
        gameSession := &GameSession{
                ID:           gameID,
                Player1:      client,
                Board:        game.NewBoard(),
                LastActivity: time.Now(),
        }

        if opponent != nil {
                h.mu.RLock()
                oppClient := h.clients[opponent.ID]
                h.mu.RUnlock()
                
                gameSession.Player2 = oppClient
                client.GameID = gameID
                oppClient.GameID = gameID
        } else {
                gameSession.Bot = bot.NewBot(game.Player2)
                client.GameID = gameID
        }

        h.mu.Lock()
        h.games[gameID] = gameSession
        h.mu.Unlock()

        h.startGame(gameSession)
}

func (h *Hub) startGame(gs *GameSession) {
        player2Name := "Bot"
        if gs.Player2 != nil {
                player2Name = gs.Player2.Username
        }

        startData := map[string]interface{}{
                "gameId":   gs.ID,
                "player1":  gs.Player1.Username,
                "player2":  player2Name,
                "yourTurn": true,
        }

        gs.Player1.send(Message{
                Type: "game_start",
                Data: startData,
        })

        if gs.Player2 != nil {
                startData["yourTurn"] = false
                gs.Player2.send(Message{
                        Type: "game_start",
                        Data: startData,
                })
        }

        if h.kafkaProducer != nil {
                h.kafkaProducer.SendEvent(kafka.GameEvent{
                        EventType: "game_started",
                        GameID:    gs.ID,
                        Data: map[string]interface{}{
                                "player1": gs.Player1.Username,
                                "player2": player2Name,
                        },
                })
        }
}

func (h *Hub) handleMove(client *Client, column int) {
        h.mu.RLock()
        gs, exists := h.games[client.GameID]
        h.mu.RUnlock()

        if !exists {
                client.sendError("Game not found")
                return
        }

        gs.mu.Lock()
        defer gs.mu.Unlock()

        currentPlayer := game.Player1
        if gs.Player2 != nil && client.ID == gs.Player2.ID {
                currentPlayer = game.Player2
        }

        if gs.Board.CurrentTurn != currentPlayer {
                client.sendError("Not your turn")
                return
        }

        move, err := gs.Board.MakeMove(column)
        if err != nil {
                client.sendError(err.Error())
                return
        }

        gs.LastActivity = time.Now()

        moveData := map[string]interface{}{
                "column": move.Column,
                "row":    move.Row,
                "player": move.Player,
        }

        h.broadcastToGame(gs, Message{
                Type: "move",
                Data: moveData,
        })

        if h.kafkaProducer != nil {
                h.kafkaProducer.SendEvent(kafka.GameEvent{
                        EventType: "move_made",
                        GameID:    gs.ID,
                        Data:      moveData,
                })
        }

        if gs.Board.GameOver {
                h.endGame(gs)
                return
        }

        if gs.Bot != nil && gs.Board.CurrentTurn == game.Player2 {
                go h.handleBotMove(gs)
        }
}

func (h *Hub) handleBotMove(gs *GameSession) {
        time.Sleep(500 * time.Millisecond)

        gs.mu.Lock()
        defer gs.mu.Unlock()

        if gs.Board.GameOver {
                return
        }

        column := gs.Bot.GetMove(gs.Board)
        if column == -1 {
                return
        }

        move, err := gs.Board.MakeMove(column)
        if err != nil {
                log.Printf("Bot move error: %v", err)
                return
        }

        gs.LastActivity = time.Now()

        h.broadcastToGame(gs, Message{
                Type: "move",
                Data: map[string]interface{}{
                        "column": move.Column,
                        "row":    move.Row,
                        "player": move.Player,
                },
        })

        if gs.Board.GameOver {
                h.endGame(gs)
        }
}

func (h *Hub) endGame(gs *GameSession) {
        winner := "Draw"
        if gs.Board.Winner == game.Player1 {
                winner = gs.Player1.Username
        } else if gs.Board.Winner == game.Player2 {
                if gs.Player2 != nil {
                        winner = gs.Player2.Username
                } else {
                        winner = "Bot"
                }
        }

        player2Name := "Bot"
        if gs.Player2 != nil {
                player2Name = gs.Player2.Username
        }

        h.broadcastToGame(gs, Message{
                Type: "game_over",
                Data: map[string]interface{}{
                        "winner": winner,
                },
        })

        movesJSON, _ := json.Marshal(gs.Board.Grid)
        if err := h.db.SaveGame(gs.Player1.Username, player2Name, winner, string(movesJSON)); err != nil {
                log.Printf("Error saving game: %v", err)
        }

        if h.kafkaProducer != nil {
                h.kafkaProducer.SendEvent(kafka.GameEvent{
                        EventType: "game_ended",
                        GameID:    gs.ID,
                        Data: map[string]interface{}{
                                "winner":  winner,
                                "player1": gs.Player1.Username,
                                "player2": player2Name,
                        },
                })
        }
}

func (h *Hub) handleDisconnect(client *Client) {
        if client.GameID == "" {
                return
        }

        h.mu.RLock()
        gs, exists := h.games[client.GameID]
        h.mu.RUnlock()

        if !exists || gs.Board.GameOver {
                return
        }

        gs.mu.Lock()
        gs.DisconnectedPlayer = client.ID
        gs.DisconnectTime = time.Now()
        gs.mu.Unlock()

        go h.handleReconnectionTimeout(gs, client.ID)
}

func (h *Hub) handleReconnectionTimeout(gs *GameSession, playerID string) {
        time.Sleep(30 * time.Second)

        gs.mu.Lock()
        defer gs.mu.Unlock()

        if gs.DisconnectedPlayer == playerID && time.Since(gs.DisconnectTime) >= 30*time.Second {
                winner := gs.Player1.Username
                if gs.Player1.ID == playerID && gs.Player2 != nil {
                        winner = gs.Player2.Username
                }

                h.broadcastToGame(gs, Message{
                        Type: "game_over",
                        Data: map[string]interface{}{
                                "winner": winner,
                                "reason": "opponent_disconnected",
                        },
                })

                gs.Board.GameOver = true
        }
}

func (h *Hub) handleReconnect(client *Client, gameID string) {
        h.mu.RLock()
        gs, exists := h.games[gameID]
        h.mu.RUnlock()

        if !exists {
                client.sendError("Game not found")
                return
        }

        gs.mu.Lock()
        defer gs.mu.Unlock()

        if gs.DisconnectedPlayer == client.ID {
                gs.DisconnectedPlayer = ""
                client.send(Message{
                        Type: "reconnected",
                        Data: map[string]interface{}{
                                "board": gs.Board.Grid,
                                "turn":  gs.Board.CurrentTurn,
                        },
                })
        }
}

func (h *Hub) broadcastToGame(gs *GameSession, msg Message) {
        gs.Player1.send(msg)
        if gs.Player2 != nil {
                gs.Player2.send(msg)
        }
}

func (h *Hub) removeClient(client *Client) {
        h.mu.Lock()
        delete(h.clients, client.ID)
        h.mu.Unlock()
}

func (c *Client) send(msg Message) {
        c.mu.Lock()
        defer c.mu.Unlock()
        c.Conn.WriteJSON(msg)
}

func (c *Client) sendError(errMsg string) {
        c.send(Message{
                Type:  "error",
                Error: errMsg,
        })
}

func (h *Hub) GetLeaderboard() ([]database.PlayerStats, error) {
        return h.db.GetLeaderboard(10)
}
