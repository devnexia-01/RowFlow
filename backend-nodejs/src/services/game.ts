import { Board, Cell, Player, Move } from '../types/index.js';

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

export function createBoard(): Board {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0)) as Board;
}

export function makeMove(board: Board, column: number, player: Player): Move | null {
  if (column < 0 || column >= COLS) {
    return null;
  }

  // Find the lowest available row in the column
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === 0) {
      board[row][column] = player;
      return { column, row, player };
    }
  }

  return null; // Column is full
}

export function checkWinner(board: Board): Player | 'Draw' | null {
  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      const player = board[row][col];
      if (player !== 0) {
        let win = true;
        for (let i = 1; i < WIN_LENGTH; i++) {
          if (board[row][col + i] !== player) {
            win = false;
            break;
          }
        }
        if (win) return player;
      }
    }
  }

  // Check vertical
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
      const player = board[row][col];
      if (player !== 0) {
        let win = true;
        for (let i = 1; i < WIN_LENGTH; i++) {
          if (board[row + i][col] !== player) {
            win = false;
            break;
          }
        }
        if (win) return player;
      }
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = 0; col <= COLS - WIN_LENGTH; col++) {
      const player = board[row][col];
      if (player !== 0) {
        let win = true;
        for (let i = 1; i < WIN_LENGTH; i++) {
          if (board[row + i][col + i] !== player) {
            win = false;
            break;
          }
        }
        if (win) return player;
      }
    }
  }

  // Check diagonal (down-left)
  for (let row = 0; row <= ROWS - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < COLS; col++) {
      const player = board[row][col];
      if (player !== 0) {
        let win = true;
        for (let i = 1; i < WIN_LENGTH; i++) {
          if (board[row + i][col - i] !== player) {
            win = false;
            break;
          }
        }
        if (win) return player;
      }
    }
  }

  // Check for draw (board full)
  let isFull = true;
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      isFull = false;
      break;
    }
  }

  return isFull ? 'Draw' : null;
}

export function isValidMove(board: Board, column: number): boolean {
  if (column < 0 || column >= COLS) {
    return false;
  }
  return board[0][column] === 0;
}

export function getValidColumns(board: Board): number[] {
  const valid: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      valid.push(col);
    }
  }
  return valid;
}
