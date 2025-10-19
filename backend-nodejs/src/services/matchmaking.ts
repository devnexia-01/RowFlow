import { v4 as uuidv4 } from 'uuid';
import { ClientConnection, GameState, Player } from '../types/index.js';
import { Game } from './game.js';
import { Bot } from './bot.js';

export class Matchmaker {
  private waitingPlayers: ClientConnection[] = [];
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map();
  private reconnectionTimeout: number;
  private matchmakingTimeout: number;
  private onGameCreated?: (game: GameState) => void;

  constructor(onGameCreated?: (game: GameState) => void) {
    this.reconnectionTimeout = parseInt(process.env.RECONNECTION_TIMEOUT || '30000');
    this.matchmakingTimeout = parseInt(process.env.MATCHMAKING_TIMEOUT || '10000');
    this.onGameCreated = onGameCreated;
  }

  addToQueue(client: ClientConnection): void {
    this.waitingPlayers.push(client);
    console.log(`Player ${client.username} added to matchmaking queue`);

    // Try to match immediately
    this.tryMatch(client);
  }

  private tryMatch(client: ClientConnection): void {
    // Check if there's another player waiting
    const otherPlayer = this.waitingPlayers.find(
      p => p.id !== client.id && !p.gameId
    );

    if (otherPlayer) {
      // Match with another player
      const game = this.createGame(client, otherPlayer);
      if (this.onGameCreated) {
        this.onGameCreated(game);
      }
    } else {
      // Set timeout to match with bot
      setTimeout(() => {
        if (!client.gameId && this.waitingPlayers.includes(client)) {
          console.log(`Matching ${client.username} with bot after timeout`);
          const game = this.createGameWithBot(client);
          if (this.onGameCreated) {
            this.onGameCreated(game);
          }
        }
      }, this.matchmakingTimeout);
    }
  }

  private createGame(player1: ClientConnection, player2: ClientConnection): GameState {
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

    this.games.set(gameId, game);
    
    player1.gameId = gameId;
    player1.playerNumber = 1;
    player2.gameId = gameId;
    player2.playerNumber = 2;

    this.playerToGame.set(player1.username, gameId);
    this.playerToGame.set(player2.username, gameId);

    // Remove from waiting queue
    this.waitingPlayers = this.waitingPlayers.filter(
      p => p.id !== player1.id && p.id !== player2.id
    );

    console.log(`Game ${gameId} created: ${player1.username} vs ${player2.username}`);
    return game;
  }

  private createGameWithBot(player: ClientConnection): GameState {
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

    this.games.set(gameId, game);
    
    player.gameId = gameId;
    player.playerNumber = 1;

    this.playerToGame.set(player.username, gameId);

    // Remove from waiting queue
    this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== player.id);

    console.log(`Game ${gameId} created: ${player.username} vs Bot`);
    return game;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  getGameByPlayer(username: string): GameState | undefined {
    const gameId = this.playerToGame.get(username);
    return gameId ? this.games.get(gameId) : undefined;
  }

  updateGame(gameId: string, game: GameState): void {
    this.games.set(gameId, game);
  }

  removeGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      this.playerToGame.delete(game.player1);
      this.playerToGame.delete(game.player2);
      this.games.delete(gameId);
      console.log(`Game ${gameId} removed`);
    }
  }

  removeFromQueue(clientId: string): void {
    this.waitingPlayers = this.waitingPlayers.filter(p => p.id !== clientId);
  }

  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }
}
