import { v4 as uuidv4 } from 'uuid';
import { ClientConnection, GameState, Player } from '../types/index.js';
import * as Game from './game.js';
import * as Bot from './bot.js';

export interface MatchmakerState {
  waitingPlayers: ClientConnection[];
  games: Map<string, GameState>;
  playerToGame: Map<string, string>;
  reconnectionTimeout: number;
  matchmakingTimeout: number;
  onGameCreated?: (game: GameState) => void;
}

export function createMatchmaker(onGameCreated?: (game: GameState) => void): MatchmakerState {
  return {
    waitingPlayers: [],
    games: new Map(),
    playerToGame: new Map(),
    reconnectionTimeout: parseInt(process.env.RECONNECTION_TIMEOUT || '30000'),
    matchmakingTimeout: parseInt(process.env.MATCHMAKING_TIMEOUT || '10000'),
    onGameCreated,
  };
}

export function addToQueue(state: MatchmakerState, client: ClientConnection): void {
  state.waitingPlayers.push(client);
  console.log(`Player ${client.username} added to matchmaking queue`);

  // Try to match immediately
  tryMatch(state, client);
}

function tryMatch(state: MatchmakerState, client: ClientConnection): void {
  // Check if there's another player waiting
  const otherPlayer = state.waitingPlayers.find(
    p => p.id !== client.id && !p.gameId
  );

  if (otherPlayer) {
    // Match with another player
    const game = createGame(state, client, otherPlayer);
    if (state.onGameCreated) {
      state.onGameCreated(game);
    }
  } else {
    // Set timeout to match with bot
    setTimeout(() => {
      if (!client.gameId && state.waitingPlayers.includes(client)) {
        console.log(`Matching ${client.username} with bot after timeout`);
        const game = createGameWithBot(state, client);
        if (state.onGameCreated) {
          state.onGameCreated(game);
        }
      }
    }, state.matchmakingTimeout);
  }
}

function createGame(state: MatchmakerState, player1: ClientConnection, player2: ClientConnection): GameState {
  const gameId = uuidv4();
  
  const game: GameState = {
    id: gameId,
    player1: player1.username,
    player2: player2.username,
    board: Game.createBoard(),
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

  // Remove from waiting queue
  state.waitingPlayers = state.waitingPlayers.filter(
    p => p.id !== player1.id && p.id !== player2.id
  );

  console.log(`Game ${gameId} created: ${player1.username} vs ${player2.username}`);
  return game;
}

function createGameWithBot(state: MatchmakerState, player: ClientConnection): GameState {
  const gameId = uuidv4();
  
  const game: GameState = {
    id: gameId,
    player1: player.username,
    player2: Bot.getBotUsername(),
    board: Game.createBoard(),
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

  // Remove from waiting queue
  state.waitingPlayers = state.waitingPlayers.filter(p => p.id !== player.id);

  console.log(`Game ${gameId} created: ${player.username} vs Bot`);
  return game;
}

export function getGame(state: MatchmakerState, gameId: string): GameState | undefined {
  return state.games.get(gameId);
}

export function getGameByPlayer(state: MatchmakerState, username: string): GameState | undefined {
  const gameId = state.playerToGame.get(username);
  return gameId ? state.games.get(gameId) : undefined;
}

export function updateGame(state: MatchmakerState, gameId: string, game: GameState): void {
  state.games.set(gameId, game);
}

export function removeGame(state: MatchmakerState, gameId: string): void {
  const game = state.games.get(gameId);
  if (game) {
    state.playerToGame.delete(game.player1);
    state.playerToGame.delete(game.player2);
    state.games.delete(gameId);
    console.log(`Game ${gameId} removed`);
  }
}

export function removeFromQueue(state: MatchmakerState, clientId: string): void {
  state.waitingPlayers = state.waitingPlayers.filter(p => p.id !== clientId);
}

export function getAllGames(state: MatchmakerState): GameState[] {
  return Array.from(state.games.values());
}
