export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];

export interface Move {
  column: number;
  row: number;
  player: Player;
}

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
