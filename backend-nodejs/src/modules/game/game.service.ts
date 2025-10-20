import { Board, Cell, Player, Move } from './game.types.js';

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;
const BOT_USERNAME = 'AI Bot';

const createBoard = (): Board => {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0)) as Board;
};

const makeMove = (board: Board, column: number, player: Player): Move | null => {
  if (column < 0 || column >= COLS) {
    return null;
  }

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === 0) {
      board[row][column] = player;
      return { column, row, player };
    }
  }

  return null;
};

const checkWinner = (board: Board): Player | 'Draw' | null => {
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

  let isFull = true;
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      isFull = false;
      break;
    }
  }

  return isFull ? 'Draw' : null;
};

const isValidMove = (board: Board, column: number): boolean => {
  if (column < 0 || column >= COLS) {
    return false;
  }
  return board[0][column] === 0;
};

const getValidColumns = (board: Board): number[] => {
  const valid: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      valid.push(col);
    }
  }
  return valid;
};

const getBotUsername = (): string => {
  return BOT_USERNAME;
};

const selectBotMove = (board: Board, botPlayer: Player): number => {
  const opponent: Player = botPlayer === 1 ? 2 : 1;

  const winningMove = findWinningMove(board, botPlayer);
  if (winningMove !== -1) {
    return winningMove;
  }

  const blockingMove = findWinningMove(board, opponent);
  if (blockingMove !== -1) {
    return blockingMove;
  }

  const strategicMove = findStrategicMove(board, botPlayer);
  if (strategicMove !== -1) {
    return strategicMove;
  }

  const validCols = getValidColumns(board);
  const centerCols = validCols.filter(col => col >= 2 && col <= 4);
  if (centerCols.length > 0) {
    return centerCols[Math.floor(Math.random() * centerCols.length)];
  }

  return validCols[Math.floor(Math.random() * validCols.length)];
};

const findWinningMove = (board: Board, player: Player): number => {
  const validCols = getValidColumns(board);

  for (const col of validCols) {
    const testBoard = board.map(row => [...row]) as Board;
    makeMove(testBoard, col, player);
    const winner = checkWinner(testBoard);
    if (winner === player) {
      return col;
    }
  }

  return -1;
};

const findStrategicMove = (board: Board, player: Player): number => {
  const validCols = getValidColumns(board);
  let bestScore = -Infinity;
  let bestCol = -1;

  for (const col of validCols) {
    const score = evaluateColumn(board, col, player);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
};

const evaluateColumn = (board: Board, column: number, player: Player): number => {
  let score = 0;

  const testBoard = board.map(row => [...row]) as Board;
  const move = makeMove(testBoard, column, player);
  if (!move) return -Infinity;

  const { row } = move;

  score += evaluateLine(testBoard, row, column, 0, 1, player);
  score += evaluateLine(testBoard, row, column, 1, 0, player);
  score += evaluateLine(testBoard, row, column, 1, 1, player);
  score += evaluateLine(testBoard, row, column, 1, -1, player);

  return score;
};

const evaluateLine = (
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  player: Player
): number => {
  let count = 0;
  let empty = 0;

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

  if (count >= 2 && empty >= 1) return count * 10;
  if (count >= 1 && empty >= 2) return count * 5;
  return count;
};

export {
  createBoard,
  makeMove,
  checkWinner,
  isValidMove,
  getValidColumns,
  getBotUsername,
  selectBotMove,
};
