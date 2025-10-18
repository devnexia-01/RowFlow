# 🎯 4 in a Row - Real-Time Multiplayer Game

## Overview
A real-time multiplayer implementation of the classic "4 in a Row" (Connect Four) game built with modern technologies.

**Tech Stack:**
- **Backend**: Go 1.24 with WebSocket support
- **Frontend**: React with Vite
- **Database**: PostgreSQL
- **Message Queue**: Kafka for analytics events
- **CI/CD**: GitHub Actions

## Project Architecture

### Backend (Go)
- `cmd/server/`: Main server entry point
- `internal/game/`: Core game logic and board state
- `internal/bot/`: Competitive AI bot implementation
- `internal/matchmaking/`: Player matching system
- `internal/websocket/`: WebSocket connection handling
- `internal/database/`: PostgreSQL data access layer
- `internal/kafka/`: Event producer for analytics

### Frontend (React)
- Vite-powered React application
- WebSocket client for real-time gameplay
- Interactive game board UI
- Leaderboard display

## Features Implemented

### Core Gameplay
- ✅ 7×6 game board
- ✅ Real-time turn-based play via WebSockets
- ✅ Win detection (horizontal, vertical, diagonal)
- ✅ Draw detection

### Matchmaking
- ✅ Player username registration
- ✅ 10-second timeout for bot pairing
- ✅ Reconnection support (30-second window)

### Competitive Bot
- ✅ Strategic move selection
- ✅ Blocking opponent wins
- ✅ Creating winning paths
- ✅ Minimax-style decision making

### Persistence & Analytics
- ✅ PostgreSQL for completed games
- ✅ Player statistics tracking
- ✅ Leaderboard with wins count
- ✅ Kafka events for game analytics

### DevOps
- ✅ GitHub Actions CI/CD pipeline
- ✅ Automated testing
- ✅ Replit deployment configuration

## Recent Changes
- [2025-10-18] Initial project setup with Go and React
- [2025-10-18] Implemented core game logic and bot AI
- [2025-10-18] Set up WebSocket server and matchmaking
- [2025-10-18] Created React frontend with game board
- [2025-10-18] Integrated PostgreSQL and Kafka
- [2025-10-18] Configured CI/CD pipelines

## Development

### Running Locally
Backend runs on port 8080
Frontend runs on port 5000 (proxied)

The application uses environment variables for configuration:
- `DATABASE_URL`: PostgreSQL connection
- `KAFKA_BROKER`: Kafka broker address
- `SESSION_SECRET`: Session management

## User Preferences
- Language: Go for backend, React for frontend
- Focus on clean code architecture
- Strategic AI for competitive gameplay
- Real-time performance priority
