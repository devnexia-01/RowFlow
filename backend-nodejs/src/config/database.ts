import pg from 'pg';
import { LeaderboardEntry } from '../types/index.js';
import { DATABASE_URL, NODE_ENV } from './env.js';
import { logInfo, logError, logWarn } from '../utils/logger.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let enabled: boolean = false;

const createDatabase = () => {
  if (DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      enabled = true;
      logInfo('✅ Database connection established');
    } catch (error) {
      logError('❌ Database connection failed:', error);
      enabled = false;
    }
  } else {
    logWarn('⚠️  No DATABASE_URL found, running without database');
    enabled = false;
  }
};

const initialize = async (): Promise<void> => {
  if (!enabled || !pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        username VARCHAR(255) PRIMARY KEY,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        player1 VARCHAR(255) REFERENCES players(username),
        player2 VARCHAR(255),
        winner VARCHAR(255),
        moves_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    logInfo('✅ Database tables initialized');
  } catch (error) {
    logError('❌ Failed to initialize database tables:', error);
  }
};

const ensurePlayer = async (username: string): Promise<void> => {
  if (!enabled || !pool) return;

  try {
    await pool.query(
      'INSERT INTO players (username) VALUES ($1) ON CONFLICT (username) DO NOTHING',
      [username]
    );
  } catch (error) {
    logError('Failed to ensure player:', error);
  }
};

const saveGame = async (
  player1: string,
  player2: string,
  winner: string | null,
  movesData: string
): Promise<void> => {
  if (!enabled || !pool) return;

  try {
    await ensurePlayer(player1);
    if (player2 !== 'AI Bot') {
      await ensurePlayer(player2);
    }

    await pool.query(
      'INSERT INTO games (player1, player2, winner, moves_data) VALUES ($1, $2, $3, $4)',
      [player1, player2, winner, movesData]
    );

    if (winner === 'Draw') {
      await pool.query('UPDATE players SET draws = draws + 1 WHERE username = $1', [player1]);
      if (player2 !== 'AI Bot') {
        await pool.query('UPDATE players SET draws = draws + 1 WHERE username = $1', [player2]);
      }
    } else if (winner) {
      await pool.query('UPDATE players SET wins = wins + 1 WHERE username = $1', [winner]);
      const loser = winner === player1 ? player2 : player1;
      if (loser !== 'AI Bot') {
        await pool.query('UPDATE players SET losses = losses + 1 WHERE username = $1', [loser]);
      }
    }

    logInfo(`✅ Game saved: ${player1} vs ${player2}, winner: ${winner}`);
  } catch (error) {
    logError('Failed to save game:', error);
  }
};

const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  if (!enabled || !pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `SELECT username, wins, losses, draws 
       FROM players 
       ORDER BY wins DESC, losses ASC 
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    logError('Failed to get leaderboard:', error);
    return [];
  }
};

const close = async (): Promise<void> => {
  if (pool) {
    await pool.end();
  }
};

export {
  createDatabase,
  initialize,
  ensurePlayer,
  saveGame,
  getLeaderboard,
  close,
};
