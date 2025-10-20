import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { ClientConnection, WsMessage, MatchmakerState } from '../modules/matchmaking/matchmaking.types.js';
import { GameState, Player } from '../modules/game/game.types.js';
import * as GameService from '../modules/game/game.service.js';
import * as MatchmakingService from '../modules/matchmaking/matchmaking.service.js';
import * as DatabaseConfig from '../config/database.js';
import * as KafkaConfig from '../config/kafka.js';
import { logInfo, logError } from '../utils/logger.js';

export interface WebSocketHandlerState {
  wss: WebSocketServer;
  clients: Map<string, ClientConnection>;
  matchmaker: MatchmakerState;
}

const createWebSocketHandler = (wss: WebSocketServer): WebSocketHandlerState => {
  const state: WebSocketHandlerState = {
    wss,
    clients: new Map(),
    matchmaker: MatchmakingService.createMatchmaker((game) => startGame(state, game)),
  };

  setupWebSocket(state);
  return state;
};

const setupWebSocket = (state: WebSocketHandlerState): void => {
  state.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = uuidv4();
    logInfo(`New WebSocket connection: ${clientId}`);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WsMessage = JSON.parse(data.toString());
        handleMessage(state, clientId, ws, message);
      } catch (error) {
        logError('Failed to parse message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      handleDisconnect(state, clientId);
    });

    ws.on('error', (error) => {
      logError(`WebSocket error for ${clientId}:`, error);
    });
  });
};

const handleMessage = (state: WebSocketHandlerState, clientId: string, ws: WebSocket, message: WsMessage): void => {
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
};

const handleJoin = (state: WebSocketHandlerState, clientId: string, ws: WebSocket, username: string): void => {
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
  MatchmakingService.addToQueue(state.matchmaker, client);

  setTimeout(() => {
    if (!client.gameId) {
      send(ws, {
        type: 'waiting',
        data: { message: 'Waiting for opponent...' },
      });
    }
  }, 100);
};

const startGame = (state: WebSocketHandlerState, game: GameState): void => {
  logInfo(`Starting game ${game.id}: ${game.player1} vs ${game.player2}`);
  logInfo(`Active clients: ${Array.from(state.clients.values()).map(c => c.username).join(', ')}`);
  
  const player1Client = Array.from(state.clients.values()).find(
    c => c.username === game.player1
  );
  const player2Client = Array.from(state.clients.values()).find(
    c => c.username === game.player2
  );

  logInfo(`Player1 client found: ${!!player1Client}, Player2 client found: ${!!player2Client}`);

  if (player1Client) {
    logInfo(`Sending game_start to ${game.player1}`);
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
    logError(`Player1 client not found: ${game.player1}`);
  }

  if (player2Client) {
    logInfo(`Sending game_start to ${game.player2}`);
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
    logError(`Player2 client not found: ${game.player2}`);
  }

  KafkaConfig.sendEvent('game_started', {
    gameId: game.id,
    player1: game.player1,
    player2: game.player2,
  });
};

const handleMove = (state: WebSocketHandlerState, clientId: string, column: number): void => {
  const client = state.clients.get(clientId);
  if (!client || !client.gameId) {
    return;
  }

  const game = MatchmakingService.getGame(state.matchmaker, client.gameId);
  if (!game || game.isFinished) {
    return;
  }

  if (game.currentTurn !== client.playerNumber) {
    sendError(client.ws, 'Not your turn');
    return;
  }

  const move = GameService.makeMove(game.board, column, game.currentTurn);
  if (!move) {
    sendError(client.ws, 'Invalid move');
    return;
  }

  game.lastMoveAt = new Date();

  broadcastMove(state, game, move);

  KafkaConfig.sendEvent('move_made', {
    gameId: game.id,
    player: game.currentTurn,
    column,
    row: move.row,
  });

  const winner = GameService.checkWinner(game.board);
  if (winner) {
    endGame(state, game, winner);
    return;
  }

  game.currentTurn = game.currentTurn === 1 ? 2 : 1;
  MatchmakingService.updateGame(state.matchmaker, game.id, game);

  if (game.player2 === GameService.getBotUsername() && game.currentTurn === 2) {
    setTimeout(() => makeBotMove(state, game.id), 1000);
  }
};

const makeBotMove = (state: WebSocketHandlerState, gameId: string): void => {
  const game = MatchmakingService.getGame(state.matchmaker, gameId);
  if (!game || game.isFinished || game.currentTurn !== 2) {
    return;
  }

  const column = GameService.selectBotMove(game.board, 2);
  const move = GameService.makeMove(game.board, column, 2);
  
  if (!move) {
    logError('Bot made invalid move');
    return;
  }

  game.lastMoveAt = new Date();

  broadcastMove(state, game, move);

  KafkaConfig.sendEvent('move_made', {
    gameId: game.id,
    player: 2,
    column,
    row: move.row,
  });

  const winner = GameService.checkWinner(game.board);
  if (winner) {
    endGame(state, game, winner);
    return;
  }

  game.currentTurn = 1;
  MatchmakingService.updateGame(state.matchmaker, game.id, game);
};

const broadcastMove = (state: WebSocketHandlerState, game: GameState, move: any): void => {
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
};

const endGame = (state: WebSocketHandlerState, game: GameState, winner: Player | 'Draw'): void => {
  game.isFinished = true;
  game.winner = winner === 'Draw' ? 'Draw' : (winner === 1 ? game.player1 : game.player2);

  DatabaseConfig.saveGame(
    game.player1,
    game.player2,
    game.winner,
    JSON.stringify(game.board)
  );

  KafkaConfig.sendEvent('game_ended', {
    gameId: game.id,
    winner: game.winner,
    player1: game.player1,
    player2: game.player2,
  });

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

  setTimeout(() => {
    MatchmakingService.removeGame(state.matchmaker, game.id);
  }, 5000);
};

const handleReconnect = (state: WebSocketHandlerState, clientId: string, ws: WebSocket, data: any): void => {
  sendError(ws, 'Reconnection not implemented yet');
};

const handleDisconnect = (state: WebSocketHandlerState, clientId: string): void => {
  const client = state.clients.get(clientId);
  if (client) {
    logInfo(`Client disconnected: ${client.username}`);
    
    MatchmakingService.removeFromQueue(state.matchmaker, clientId);
    
    if (client.gameId) {
      const game = MatchmakingService.getGame(state.matchmaker, client.gameId);
      if (game && !game.isFinished) {
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

        MatchmakingService.removeGame(state.matchmaker, game.id);
      }
    }

    state.clients.delete(clientId);
  }
};

const send = (ws: WebSocket, message: any): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
};

const sendError = (ws: WebSocket, error: string): void => {
  send(ws, { type: 'error', error });
};

export {
  createWebSocketHandler,
};
