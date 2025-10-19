import { Board, Cell, Player, Move } from '../types/index.js';

export class Game {
  private static readonly ROWS = 6;
  private static readonly COLS = 7;
  private static readonly WIN_LENGTH = 4;

  static createBoard(): Board {
    return Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0)) as Board;
  }

  static makeMove(board: Board, column: number, player: Player): Move | null {
    if (column < 0 || column >= this.COLS) {
      return null;
    }

    // Find the lowest available row in the column
    for (let row = this.ROWS - 1; row >= 0; row--) {
      if (board[row][column] === 0) {
        board[row][column] = player;
        return { column, row, player };
      }
    }

    return null; // Column is full
  }

  static checkWinner(board: Board): Player | 'Draw' | null {
    // Check horizontal
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col <= this.COLS - this.WIN_LENGTH; col++) {
        const player = board[row][col];
        if (player !== 0) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
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
    for (let col = 0; col < this.COLS; col++) {
      for (let row = 0; row <= this.ROWS - this.WIN_LENGTH; row++) {
        const player = board[row][col];
        if (player !== 0) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
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
    for (let row = 0; row <= this.ROWS - this.WIN_LENGTH; row++) {
      for (let col = 0; col <= this.COLS - this.WIN_LENGTH; col++) {
        const player = board[row][col];
        if (player !== 0) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
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
    for (let row = 0; row <= this.ROWS - this.WIN_LENGTH; row++) {
      for (let col = this.WIN_LENGTH - 1; col < this.COLS; col++) {
        const player = board[row][col];
        if (player !== 0) {
          let win = true;
          for (let i = 1; i < this.WIN_LENGTH; i++) {
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
    for (let col = 0; col < this.COLS; col++) {
      if (board[0][col] === 0) {
        isFull = false;
        break;
      }
    }

    return isFull ? 'Draw' : null;
  }

  static isValidMove(board: Board, column: number): boolean {
    if (column < 0 || column >= this.COLS) {
      return false;
    }
    return board[0][column] === 0;
  }

  static getValidColumns(board: Board): number[] {
    const valid: number[] = [];
    for (let col = 0; col < this.COLS; col++) {
      if (board[0][col] === 0) {
        valid.push(col);
      }
    }
    return valid;
  }
}
