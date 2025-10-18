package database

import (
	"database/sql"
	"fmt"
	"os"
	_ "github.com/lib/pq"
)

type DB struct {
	conn *sql.DB
}

type GameResult struct {
	ID        int
	Player1   string
	Player2   string
	Winner    string
	MovesData string
	CreatedAt string
}

type PlayerStats struct {
	Username  string
	Wins      int
	Losses    int
	Draws     int
	TotalGames int
}

func NewDB() (*DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	conn, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, err
	}

	if err := conn.Ping(); err != nil {
		return nil, err
	}

	db := &DB{conn: conn}
	if err := db.initSchema(); err != nil {
		return nil, err
	}

	return db, nil
}

func (db *DB) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS players (
		username VARCHAR(255) PRIMARY KEY,
		wins INTEGER DEFAULT 0,
		losses INTEGER DEFAULT 0,
		draws INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS games (
		id SERIAL PRIMARY KEY,
		player1 VARCHAR(255) REFERENCES players(username),
		player2 VARCHAR(255),
		winner VARCHAR(255),
		moves_data TEXT,
		created_at TIMESTAMP DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1);
	CREATE INDEX IF NOT EXISTS idx_games_winner ON games(winner);
	`

	_, err := db.conn.Exec(schema)
	return err
}

func (db *DB) EnsurePlayer(username string) error {
	query := `
		INSERT INTO players (username) 
		VALUES ($1) 
		ON CONFLICT (username) DO NOTHING
	`
	_, err := db.conn.Exec(query, username)
	return err
}

func (db *DB) SaveGame(player1, player2, winner, movesData string) error {
	tx, err := db.conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := db.EnsurePlayer(player1); err != nil {
		return err
	}
	if player2 != "Bot" {
		if err := db.EnsurePlayer(player2); err != nil {
			return err
		}
	}

	_, err = tx.Exec(`
		INSERT INTO games (player1, player2, winner, moves_data)
		VALUES ($1, $2, $3, $4)
	`, player1, player2, winner, movesData)
	if err != nil {
		return err
	}

	if winner != "" && winner != "Draw" {
		_, err = tx.Exec(`
			UPDATE players SET wins = wins + 1 WHERE username = $1
		`, winner)
		if err != nil {
			return err
		}

		loser := player1
		if loser == winner {
			loser = player2
		}
		if loser != "Bot" {
			_, err = tx.Exec(`
				UPDATE players SET losses = losses + 1 WHERE username = $1
			`, loser)
			if err != nil {
				return err
			}
		}
	} else if winner == "Draw" {
		_, err = tx.Exec(`
			UPDATE players SET draws = draws + 1 WHERE username IN ($1, $2)
		`, player1, player2)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (db *DB) GetLeaderboard(limit int) ([]PlayerStats, error) {
	query := `
		SELECT username, wins, losses, draws, (wins + losses + draws) as total_games
		FROM players
		ORDER BY wins DESC, total_games DESC
		LIMIT $1
	`

	rows, err := db.conn.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []PlayerStats
	for rows.Next() {
		var s PlayerStats
		if err := rows.Scan(&s.Username, &s.Wins, &s.Losses, &s.Draws, &s.TotalGames); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}

	return stats, nil
}

func (db *DB) Close() error {
	return db.conn.Close()
}
