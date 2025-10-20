import { v4 as uuidv4 } from 'uuid';
import { ClientConnection, MatchmakerState } from './matchmaking.types.js';
import { GameState } from '../game/game.types.js';
import * as GameService from '../game/game.service.js';
import { RECONNECTION_TIMEOUT, MATCHMAKING_TIMEOUT } from '../../config/env.js';
import { logInfo } from '../../utils/logger.js';

const createMatchmaker = (onGameCreated?: (game: GameState) => void): MatchmakerState => {
  return {
    waitingPlayers: [],
    games: new Map(),
    playerToGame: new Map(),
    reconnectionTimeout: RECONNECTION_TIMEOUT,
    matchmakingTimeout: MATCHMAKING_TIMEOUT,
    onGameCreated,
  };
};

const addToQueue = (state: MatchmakerState, client: ClientConnection): void => {
  state.waitingPlayers.push(client);
  logInfo(`Player ${client.username} added to matchmaking queue`);

  tryMatch(state, client);
};

const tryMatch = (state: MatchmakerState, client: ClientConnection): void => {
  const otherPlayer = state.waitingPlayers.find(
    p => p.id !== client.id && !p.gameId
  );

  if (otherPlayer) {
    const game = createGame(state, client, otherPlayer);
    if (state.onGameCreated) {
      state.onGameCreated(game);
    }
  } else {
    setTimeout(() => {
      if (!client.gameId && state.waitingPlayers.includes(client)) {
        logInfo(`Matching ${client.username} with bot after timeout`);
        const game = createGameWithBot(state, client);
        if (state.onGameCreated) {
          state.onGameCreated(game);
        }
      }
    }, state.matchmakingTimeout);
  }
};

const createGame = (state: MatchmakerState, player1: ClientConnection, player2: ClientConnection): GameState => {
  const gameId = uuidv4();
  
  const game: GameState = {
    id: gameId,
    player1: player1.username,
    player2: player2.username,
    board: GameService.createBoard(),
    currentTurn: 1,
    winner: null,
    isFinished: false,
    createdAt: new Date(),
    lastMoveAt: new Date(),
  };

  state.games.set(gameId, game);
  
  player1.gameId = gameId;
  player1.playerNumber = 1;
  player2.gameId = gameId;
  player2.playerNumber = 2;

  state.playerToGame.set(player1.username, gameId);
  state.playerToGame.set(player2.username, gameId);

  state.waitingPlayers = state.waitingPlayers.filter(
    p => p.id !== player1.id && p.id !== player2.id
  );

  logInfo(`Game ${gameId} created: ${player1.username} vs ${player2.username}`);
  return game;
};

const createGameWithBot = (state: MatchmakerState, player: ClientConnection): GameState => {
  const gameId = uuidv4();
  
  const game: GameState = {
    id: gameId,
    player1: player.username,
    player2: GameService.getBotUsername(),
    board: GameService.createBoard(),
    currentTurn: 1,
    winner: null,
    isFinished: false,
    createdAt: new Date(),
    lastMoveAt: new Date(),
  };

  state.games.set(gameId, game);
  
  player.gameId = gameId;
  player.playerNumber = 1;

  state.playerToGame.set(player.username, gameId);

  state.waitingPlayers = state.waitingPlayers.filter(p => p.id !== player.id);

  logInfo(`Game ${gameId} created: ${player.username} vs Bot`);
  return game;
};

const getGame = (state: MatchmakerState, gameId: string): GameState | undefined => {
  return state.games.get(gameId);
};

const getGameByPlayer = (state: MatchmakerState, username: string): GameState | undefined => {
  const gameId = state.playerToGame.get(username);
  return gameId ? state.games.get(gameId) : undefined;
};

const updateGame = (state: MatchmakerState, gameId: string, game: GameState): void => {
  state.games.set(gameId, game);
};

const removeGame = (state: MatchmakerState, gameId: string): void => {
  const game = state.games.get(gameId);
  if (game) {
    state.playerToGame.delete(game.player1);
    state.playerToGame.delete(game.player2);
    state.games.delete(gameId);
    logInfo(`Game ${gameId} removed`);
  }
};

const removeFromQueue = (state: MatchmakerState, clientId: string): void => {
  state.waitingPlayers = state.waitingPlayers.filter(p => p.id !== clientId);
};

const getAllGames = (state: MatchmakerState): GameState[] => {
  return Array.from(state.games.values());
};

export {
  createMatchmaker,
  addToQueue,
  getGame,
  getGameByPlayer,
  updateGame,
  removeGame,
  removeFromQueue,
  getAllGames,
};
