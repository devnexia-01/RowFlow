export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  draws: number;
}
