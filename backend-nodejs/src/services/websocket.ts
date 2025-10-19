import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { ClientConnection, WsMessage, Player } from '../types/index.js';
import { Game } from './game.js';
import { Bot } from './bot.js';
import { Matchmaker } from './matchmaking.js';
import { Database } from './database.js';
import { KafkaProducer } from './kafka.js';

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private matchmaker: Matchmaker;
  private db: Database;
  private kafka: KafkaProducer;

  constructor(
    wss: WebSocketServer,
    db: Database,
    kafka: KafkaProducer
  ) {
    this.wss = wss;
    this.db = db;
    this.kafka = kafka;
    this.matchmaker = new Matchmaker((game) => this.startGame(game));

    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = uuidv4();
      console.log(`New WebSocket connection: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message: WsMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
      });
    });
  }

  private handleMessage(clientId: string, ws: WebSocket, message: WsMessage): void {
    switch (message.type) {
      case 'join':
        this.handleJoin(clientId, ws, message.data.username);
        break;
      case 'move':
        this.handleMove(clientId, message.data.column);
        break;
      case 'reconnect':
        this.handleReconnect(clientId, ws, message.data);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private handleJoin(clientId: string, ws: WebSocket, username: string): void {
    if (!username || username.trim().length === 0) {
      this.sendError(ws, 'Username is required');
      return;
    }

    const client: ClientConnection = {
      id: clientId,
      username: username.trim(),
      ws,
      lastSeen: new Date(),
    };

    this.clients.set(clientId, client);
    this.matchmaker.addToQueue(client);

    this.send(ws, {
      type: 'waiting',
      data: { message: 'Waiting for opponent...' },
    });
  }

  private startGame(game: any): void {
    const player1Client = Array.from(this.clients.values()).find(
      c => c.username === game.player1
    );
    const player2Client = Array.from(this.clients.values()).find(
      c => c.username === game.player2
    );

    if (player1Client) {
      this.send(player1Client.ws, {
        type: 'game_start',
        data: {
          gameId: game.id,
          player1: game.player1,
          player2: game.player2,
          yourTurn: true,
        },
      });
    }

    if (player2Client) {
      this.send(player2Client.ws, {
        type: 'game_start',
        data: {
          gameId: game.id,
          player1: game.player1,
          player2: game.player2,
          yourTurn: false,
        },
      });
    }

    // Send Kafka event
    this.kafka.sendEvent('game_started', {
      gameId: game.id,
      player1: game.player1,
      player2: game.player2,
    });
  }

  private handleMove(clientId: string, column: number): void {
    const client = this.clients.get(clientId);
    if (!client || !client.gameId) {
      return;
    }

    const game = this.matchmaker.getGame(client.gameId);
    if (!game || game.isFinished) {
      return;
    }

    // Check if it's the player's turn
    if (game.currentTurn !== client.playerNumber) {
      this.sendError(client.ws, 'Not your turn');
      return;
    }

    // Make the move
    const move = Game.makeMove(game.board, column, game.currentTurn);
    if (!move) {
      this.sendError(client.ws, 'Invalid move');
      return;
    }

    game.lastMoveAt = new Date();

    // Broadcast move to all players
    this.broadcastMove(game, move);

    // Send Kafka event
    this.kafka.sendEvent('move_made', {
      gameId: game.id,
      player: game.currentTurn,
      column,
      row: move.row,
    });

    // Check for winner
    const winner = Game.checkWinner(game.board);
    if (winner) {
      this.endGame(game, winner);
      return;
    }

    // Switch turn
    game.currentTurn = game.currentTurn === 1 ? 2 : 1;
    this.matchmaker.updateGame(game.id, game);

    // If it's bot's turn, make bot move
    if (game.player2 === Bot.getBotUsername() && game.currentTurn === 2) {
      setTimeout(() => this.makeBotMove(game.id), 1000);
    }
  }

  private makeBotMove(gameId: string): void {
    const game = this.matchmaker.getGame(gameId);
    if (!game || game.isFinished || game.currentTurn !== 2) {
      return;
    }

    const column = Bot.selectMove(game.board, 2);
    const move = Game.makeMove(game.board, column, 2);
    
    if (!move) {
      console.error('Bot made invalid move');
      return;
    }

    game.lastMoveAt = new Date();

    // Broadcast bot move
    this.broadcastMove(game, move);

    // Send Kafka event
    this.kafka.sendEvent('move_made', {
      gameId: game.id,
      player: 2,
      column,
      row: move.row,
    });

    // Check for winner
    const winner = Game.checkWinner(game.board);
    if (winner) {
      this.endGame(game, winner);
      return;
    }

    // Switch turn back to player
    game.currentTurn = 1;
    this.matchmaker.updateGame(game.id, game);
  }

  private broadcastMove(game: any, move: any): void {
    const clients = Array.from(this.clients.values()).filter(
      c => c.gameId === game.id
    );

    const message = {
      type: 'move',
      data: move,
    };

    clients.forEach(client => {
      this.send(client.ws, message);
    });
  }

  private endGame(game: any, winner: Player | 'Draw'): void {
    game.isFinished = true;
    game.winner = winner === 'Draw' ? 'Draw' : (winner === 1 ? game.player1 : game.player2);

    // Save to database
    this.db.saveGame(
      game.player1,
      game.player2,
      game.winner,
      JSON.stringify(game.board)
    );

    // Send Kafka event
    this.kafka.sendEvent('game_ended', {
      gameId: game.id,
      winner: game.winner,
      player1: game.player1,
      player2: game.player2,
    });

    // Notify players
    const clients = Array.from(this.clients.values()).filter(
      c => c.gameId === game.id
    );

    const message = {
      type: 'game_over',
      data: {
        winner: game.winner,
        reason: 'game_complete',
      },
    };

    clients.forEach(client => {
      this.send(client.ws, message);
    });

    // Clean up after 5 seconds
    setTimeout(() => {
      this.matchmaker.removeGame(game.id);
    }, 5000);
  }

  private handleReconnect(clientId: string, ws: WebSocket, data: any): void {
    // Implementation for reconnection
    this.sendError(ws, 'Reconnection not implemented yet');
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`Client disconnected: ${client.username}`);
      
      // Remove from matchmaking queue
      this.matchmaker.removeFromQueue(clientId);
      
      // Handle game disconnection
      if (client.gameId) {
        const game = this.matchmaker.getGame(client.gameId);
        if (game && !game.isFinished) {
          // End game due to disconnection
          game.isFinished = true;
          const opponent = game.player1 === client.username ? game.player2 : game.player1;
          game.winner = opponent;

          const opponentClient = Array.from(this.clients.values()).find(
            c => c.username === opponent
          );

          if (opponentClient) {
            this.send(opponentClient.ws, {
              type: 'game_over',
              data: {
                winner: opponent,
                reason: 'opponent_disconnected',
              },
            });
          }

          this.matchmaker.removeGame(game.id);
        }
      }

      this.clients.delete(clientId);
    }
  }

  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, { type: 'error', error });
  }

  async getLeaderboard(): Promise<any[]> {
    return await this.db.getLeaderboard();
  }
}
