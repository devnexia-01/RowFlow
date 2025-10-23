# 4 in a Row Game

Real-time multiplayer Connect Four implementation with Go backend and React frontend.

## Tech Stack

- **Backend**: Go 1.24 with gorilla/websocket (currently running on port 5000)
- **Frontend**: React with Vite
- **Database**: PostgreSQL with Replit Database
- **Message Queue**: Kafka (optional)

## Project Structure

### Go Backend (backend-go/)
- `cmd/server/` - Server entry point
- `internal/game/` - Core game logic  
- `internal/bot/` - AI bot
- `internal/matchmaking/` - Player matching
- `internal/websocket/` - WebSocket hub with reconnection handling
- `internal/database/` - PostgreSQL layer
- `internal/kafka/` - Event producer

### React Frontend (frontend/)
- Vite dev server
- WebSocket client
- Game board UI
- Leaderboard with player stats

## Features

- **Core Gameplay**
  - 7×6 game board
  - Real-time WebSocket gameplay
  - Win detection (horizontal, vertical, diagonal)
  - Bot opponent with strategic AI
  
- **Matchmaking**
  - Player matchmaking (10s timeout before bot)
  - Automatic bot matching if no opponent available

- **Reconnection Handling** ⭐ NEW
  - 30-second grace period for disconnected players
  - Automatic game forfeiture if player doesn't reconnect
  - Opponent declared winner on disconnection timeout

- **Leaderboard** ⭐ ENHANCED
  - Track wins, losses, and draws per player
  - Display total games played
  - Top 10 players ranked by wins
  - Live updates every 10 seconds

- **Persistence**
  - PostgreSQL stats tracking
  - Game history storage
  - Player statistics persistence

- **Analytics** (optional)
  - Kafka event streaming
  - Game event tracking

## Environment Variables

All optional:
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection (automatically provided by Replit)
- `KAFKA_ENABLED` - Enable events (default: false)
- `KAFKA_BROKER` - Kafka address

## Running Locally

The Go backend serves both API and built frontend on port 5000:
- WebSocket: `ws://localhost:5000/ws`
- API: `http://localhost:5000/api/*`

Frontend must be built before starting backend:
```bash
cd frontend && npm install && npm run build
cd ../backend-go && PORT=5000 go run ./cmd/server
```

## Deployment

Configured for Replit autoscale deployment:
- Build: Frontend compilation with Vite
- Run: Go server on port 5000
- Database: Automatic PostgreSQL provisioning

## Alternative Node.js Backend

There's also a Node.js/TypeScript backend in `backend-nodejs/` that implements the same functionality. To switch, just change the workflow command to use the Node backend instead.
