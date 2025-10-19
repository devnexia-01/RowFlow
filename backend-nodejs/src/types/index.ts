export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];

export interface GameState {
  id: string;
  player1: string;
  player2: string;
  board: Board;
  currentTurn: Player;
  winner: string | null;
  isFinished: boolean;
  createdAt: Date;
  lastMoveAt: Date;
}

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

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  draws: number;
}

export interface Move {
  column: number;
  row: number;
  player: Player;
}
