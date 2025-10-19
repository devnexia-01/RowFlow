import { Board, Player } from '../types/index.js';
import { Game } from './game.js';

export class Bot {
  private static readonly BOT_USERNAME = 'AI Bot';

  static getBotUsername(): string {
    return this.BOT_USERNAME;
  }

  static selectMove(board: Board, botPlayer: Player): number {
    const opponent: Player = botPlayer === 1 ? 2 : 1;

    // 1. Check for winning move
    const winningMove = this.findWinningMove(board, botPlayer);
    if (winningMove !== -1) {
      return winningMove;
    }

    // 2. Block opponent's winning move
    const blockingMove = this.findWinningMove(board, opponent);
    if (blockingMove !== -1) {
      return blockingMove;
    }

    // 3. Strategic positioning
    const strategicMove = this.findStrategicMove(board, botPlayer);
    if (strategicMove !== -1) {
      return strategicMove;
    }

    // 4. Prefer center columns
    const validCols = Game.getValidColumns(board);
    const centerCols = validCols.filter(col => col >= 2 && col <= 4);
    if (centerCols.length > 0) {
      return centerCols[Math.floor(Math.random() * centerCols.length)];
    }

    // 5. Random valid move
    return validCols[Math.floor(Math.random() * validCols.length)];
  }

  private static findWinningMove(board: Board, player: Player): number {
    const validCols = Game.getValidColumns(board);

    for (const col of validCols) {
      const testBoard = board.map(row => [...row]) as Board;
      Game.makeMove(testBoard, col, player);
      const winner = Game.checkWinner(testBoard);
      if (winner === player) {
        return col;
      }
    }

    return -1;
  }

  private static findStrategicMove(board: Board, player: Player): number {
    const validCols = Game.getValidColumns(board);
    let bestScore = -Infinity;
    let bestCol = -1;

    for (const col of validCols) {
      const score = this.evaluateColumn(board, col, player);
      if (score > bestScore) {
        bestScore = score;
        bestCol = col;
      }
    }

    return bestCol;
  }

  private static evaluateColumn(board: Board, column: number, player: Player): number {
    let score = 0;

    // Simulate the move
    const testBoard = board.map(row => [...row]) as Board;
    const move = Game.makeMove(testBoard, column, player);
    if (!move) return -Infinity;

    const { row } = move;

    // Evaluate horizontal potential
    score += this.evaluateLine(testBoard, row, column, 0, 1, player);

    // Evaluate vertical potential
    score += this.evaluateLine(testBoard, row, column, 1, 0, player);

    // Evaluate diagonal potential (down-right)
    score += this.evaluateLine(testBoard, row, column, 1, 1, player);

    // Evaluate diagonal potential (down-left)
    score += this.evaluateLine(testBoard, row, column, 1, -1, player);

    return score;
  }

  private static evaluateLine(
    board: Board,
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    player: Player
  ): number {
    let count = 0;
    let empty = 0;

    // Check in both directions
    for (let dir = -1; dir <= 1; dir += 2) {
      for (let i = 1; i < 4; i++) {
        const r = row + dRow * i * dir;
        const c = col + dCol * i * dir;

        if (r < 0 || r >= 6 || c < 0 || c >= 7) break;

        const cell = board[r][c];
        if (cell === player) {
          count++;
        } else if (cell === 0) {
          empty++;
          break;
        } else {
          break;
        }
      }
    }

    // Score based on potential for 4-in-a-row
    if (count >= 2 && empty >= 1) return count * 10;
    if (count >= 1 && empty >= 2) return count * 5;
    return count;
  }
}
