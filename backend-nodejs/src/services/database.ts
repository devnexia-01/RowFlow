import pg from 'pg';
import { LeaderboardEntry } from '../types/index.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool | null = null;
  private enabled: boolean = false;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl) {
      try {
        this.pool = new Pool({
          connectionString: databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        this.enabled = true;
        console.log('✅ Database connection established');
      } catch (error) {
        console.error('❌ Database connection failed:', error);
        this.enabled = false;
      }
    } else {
      console.warn('⚠️  No DATABASE_URL found, running without database');
      this.enabled = false;
    }
  }

  async initialize(): Promise<void> {
    if (!this.enabled || !this.pool) return;

    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS players (
          username VARCHAR(255) PRIMARY KEY,
          wins INTEGER DEFAULT 0,
          losses INTEGER DEFAULT 0,
          draws INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          player1 VARCHAR(255) REFERENCES players(username),
          player2 VARCHAR(255),
          winner VARCHAR(255),
          moves_data TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database tables:', error);
    }
  }

  async ensurePlayer(username: string): Promise<void> {
    if (!this.enabled || !this.pool) return;

    try {
      await this.pool.query(
        'INSERT INTO players (username) VALUES ($1) ON CONFLICT (username) DO NOTHING',
        [username]
      );
    } catch (error) {
      console.error('Failed to ensure player:', error);
    }
  }

  async saveGame(
    player1: string,
    player2: string,
    winner: string | null,
    movesData: string
  ): Promise<void> {
    if (!this.enabled || !this.pool) return;

    try {
      await this.ensurePlayer(player1);
      if (player2 !== 'AI Bot') {
        await this.ensurePlayer(player2);
      }

      await this.pool.query(
        'INSERT INTO games (player1, player2, winner, moves_data) VALUES ($1, $2, $3, $4)',
        [player1, player2, winner, movesData]
      );

      // Update player stats
      if (winner === 'Draw') {
        await this.pool.query('UPDATE players SET draws = draws + 1 WHERE username = $1', [player1]);
        if (player2 !== 'AI Bot') {
          await this.pool.query('UPDATE players SET draws = draws + 1 WHERE username = $1', [player2]);
        }
      } else if (winner) {
        await this.pool.query('UPDATE players SET wins = wins + 1 WHERE username = $1', [winner]);
        const loser = winner === player1 ? player2 : player1;
        if (loser !== 'AI Bot') {
          await this.pool.query('UPDATE players SET losses = losses + 1 WHERE username = $1', [loser]);
        }
      }

      console.log(`✅ Game saved: ${player1} vs ${player2}, winner: ${winner}`);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.enabled || !this.pool) {
      return [];
    }

    try {
      const result = await this.pool.query(
        `SELECT username, wins, losses, draws 
         FROM players 
         ORDER BY wins DESC, losses ASC 
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}
