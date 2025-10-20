import { GameState, Player } from '../game/game.types.js';

export interface ClientConnection {
  id: string;
  username: string;
  gameId?: string;
  playerNumber?: Player;
  ws: any;
  lastSeen: Date;
}

export interface WsMessage {
  type: 'join' | 'move' | 'reconnect';
  data: any;
}

export interface MatchmakerState {
  waitingPlayers: ClientConnection[];
  games: Map<string, GameState>;
  playerToGame: Map<string, string>;
  reconnectionTimeout: number;
  matchmakingTimeout: number;
  onGameCreated?: (game: GameState) => void;
}
