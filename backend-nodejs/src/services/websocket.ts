import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { ClientConnection, WsMessage, Player } from '../types/index.js';
import * as Game from './game.js';
import * as Bot from './bot.js';
import * as Matchmaking from './matchmaking.js';
import * as Database from './database.js';
import * as Kafka from './kafka.js';

export interface WebSocketHandlerState {
  wss: WebSocketServer;
  clients: Map<string, ClientConnection>;
  matchmaker: Matchmaking.MatchmakerState;
}

export function createWebSocketHandler(wss: WebSocketServer): WebSocketHandlerState {
  const state: WebSocketHandlerState = {
    wss,
    clients: new Map(),
    matchmaker: Matchmaking.createMatchmaker((game) => startGame(state, game)),
  };

  setupWebSocket(state);
  return state;
}

function setupWebSocket(state: WebSocketHandlerState): void {
  state.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = uuidv4();
    console.log(`New WebSocket connection: ${clientId}`);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WsMessage = JSON.parse(data.toString());
        handleMessage(state, clientId, ws, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      handleDisconnect(state, clientId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });
  });
}

function handleMessage(state: WebSocketHandlerState, clientId: string, ws: WebSocket, message: WsMessage): void {
  switch (message.type) {
    case 'join':
      handleJoin(state, clientId, ws, message.data.username);
      break;
    case 'move':
      handleMove(state, clientId, message.data.column);
      break;
    case 'reconnect':
      handleReconnect(state, clientId, ws, message.data);
      break;
    default:
      sendError(ws, 'Unknown message type');
  }
}

function handleJoin(state: WebSocketHandlerState, clientId: string, ws: WebSocket, username: string): void {
  if (!username || username.trim().length === 0) {
    sendError(ws, 'Username is required');
    return;
  }

  const client: ClientConnection = {
    id: clientId,
    username: username.trim(),
    ws,
    lastSeen: new Date(),
  };

  state.clients.set(clientId, client);
  Matchmaking.addToQueue(state.matchmaker, client);

  // Only send waiting message if not immediately matched
  // Check if the client has a gameId after matchmaking
  setTimeout(() => {
    if (!client.gameId) {
      send(ws, {
        type: 'waiting',
        data: { message: 'Waiting for opponent...' },
      });
    }
  }, 100);
}

function startGame(state: WebSocketHandlerState, game: any): void {
  console.log(`Starting game ${game.id}: ${game.player1} vs ${game.player2}`);
  console.log(`Active clients: ${Array.from(state.clients.values()).map(c => c.username).join(', ')}`);
  
  const player1Client = Array.from(state.clients.values()).find(
    c => c.username === game.player1
  );
  const player2Client = Array.from(state.clients.values()).find(
    c => c.username === game.player2
  );

  console.log(`Player1 client found: ${!!player1Client}, Player2 client found: ${!!player2Client}`);

  if (player1Client) {
    console.log(`Sending game_start to ${game.player1}`);
    send(player1Client.ws, {
      type: 'game_start',
      data: {
        gameId: game.id,
        player1: game.player1,
        player2: game.player2,
        yourTurn: true,
      },
    });
  } else {
    console.error(`Player1 client not found: ${game.player1}`);
  }

  if (player2Client) {
    console.log(`Sending game_start to ${game.player2}`);
    send(player2Client.ws, {
      type: 'game_start',
      data: {
        gameId: game.id,
        player1: game.player1,
        player2: game.player2,
        yourTurn: false,
      },
    });
  } else {
    console.error(`Player2 client not found: ${game.player2}`);
  }

  // Send Kafka event
  Kafka.sendEvent('game_started', {
    gameId: game.id,
    player1: game.player1,
    player2: game.player2,
  });
}

function handleMove(state: WebSocketHandlerState, clientId: string, column: number): void {
  const client = state.clients.get(clientId);
  if (!client || !client.gameId) {
    return;
  }

  const game = Matchmaking.getGame(state.matchmaker, client.gameId);
  if (!game || game.isFinished) {
    return;
  }

  // Check if it's the player's turn
  if (game.currentTurn !== client.playerNumber) {
    sendError(client.ws, 'Not your turn');
    return;
  }

  // Make the move
  const move = Game.makeMove(game.board, column, game.currentTurn);
  if (!move) {
    sendError(client.ws, 'Invalid move');
    return;
  }

  game.lastMoveAt = new Date();

  // Broadcast move to all players
  broadcastMove(state, game, move);

  // Send Kafka event
  Kafka.sendEvent('move_made', {
    gameId: game.id,
    player: game.currentTurn,
    column,
    row: move.row,
  });

  // Check for winner
  const winner = Game.checkWinner(game.board);
  if (winner) {
    endGame(state, game, winner);
    return;
  }

  // Switch turn
  game.currentTurn = game.currentTurn === 1 ? 2 : 1;
  Matchmaking.updateGame(state.matchmaker, game.id, game);

  // If it's bot's turn, make bot move
  if (game.player2 === Bot.getBotUsername() && game.currentTurn === 2) {
    setTimeout(() => makeBotMove(state, game.id), 1000);
  }
}

function makeBotMove(state: WebSocketHandlerState, gameId: string): void {
  const game = Matchmaking.getGame(state.matchmaker, gameId);
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
  broadcastMove(state, game, move);

  // Send Kafka event
  Kafka.sendEvent('move_made', {
    gameId: game.id,
    player: 2,
    column,
    row: move.row,
  });

  // Check for winner
  const winner = Game.checkWinner(game.board);
  if (winner) {
    endGame(state, game, winner);
    return;
  }

  // Switch turn back to player
  game.currentTurn = 1;
  Matchmaking.updateGame(state.matchmaker, game.id, game);
}

function broadcastMove(state: WebSocketHandlerState, game: any, move: any): void {
  const clients = Array.from(state.clients.values()).filter(
    c => c.gameId === game.id
  );

  const message = {
    type: 'move',
    data: move,
  };

  clients.forEach(client => {
    send(client.ws, message);
  });
}

function endGame(state: WebSocketHandlerState, game: any, winner: Player | 'Draw'): void {
  game.isFinished = true;
  game.winner = winner === 'Draw' ? 'Draw' : (winner === 1 ? game.player1 : game.player2);

  // Save to database
  Database.saveGame(
    game.player1,
    game.player2,
    game.winner,
    JSON.stringify(game.board)
  );

  // Send Kafka event
  Kafka.sendEvent('game_ended', {
    gameId: game.id,
    winner: game.winner,
    player1: game.player1,
    player2: game.player2,
  });

  // Notify players
  const clients = Array.from(state.clients.values()).filter(
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
    send(client.ws, message);
  });

  // Clean up after 5 seconds
  setTimeout(() => {
    Matchmaking.removeGame(state.matchmaker, game.id);
  }, 5000);
}

function handleReconnect(state: WebSocketHandlerState, clientId: string, ws: WebSocket, data: any): void {
  // Implementation for reconnection
  sendError(ws, 'Reconnection not implemented yet');
}

function handleDisconnect(state: WebSocketHandlerState, clientId: string): void {
  const client = state.clients.get(clientId);
  if (client) {
    console.log(`Client disconnected: ${client.username}`);
    
    // Remove from matchmaking queue
    Matchmaking.removeFromQueue(state.matchmaker, clientId);
    
    // Handle game disconnection
    if (client.gameId) {
      const game = Matchmaking.getGame(state.matchmaker, client.gameId);
      if (game && !game.isFinished) {
        // End game due to disconnection
        game.isFinished = true;
        const opponent = game.player1 === client.username ? game.player2 : game.player1;
        game.winner = opponent;

        const opponentClient = Array.from(state.clients.values()).find(
          c => c.username === opponent
        );

        if (opponentClient) {
          send(opponentClient.ws, {
            type: 'game_over',
            data: {
              winner: opponent,
              reason: 'opponent_disconnected',
            },
          });
        }

        Matchmaking.removeGame(state.matchmaker, game.id);
      }
    }

    state.clients.delete(clientId);
  }
}

function send(ws: WebSocket, message: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, error: string): void {
  send(ws, { type: 'error', error });
}

export async function getLeaderboard(state: WebSocketHandlerState): Promise<any[]> {
  return await Database.getLeaderboard();
}
