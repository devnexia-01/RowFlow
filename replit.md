# 🎯 4 in a Row - Real-Time Multiplayer Game

## Overview
A real-time multiplayer implementation of the classic "4 in a Row" (Connect Four) game built with modern web technologies and best practices.

**Tech Stack:**
- **Backend**: Node.js with TypeScript, Express, and WebSocket support
- **Frontend**: React with Vite
- **Database**: PostgreSQL (optional, works without it)
- **Message Queue**: Kafka for analytics events (optional)
- **Package Manager**: npm
- **Runtime**: Node.js 20

## Project Architecture

### Backend (Node.js/TypeScript)
Located in `backend-nodejs/`:
- `src/index.ts`: Main server entry point with Express setup
- `src/services/game.ts`: Core game logic and board state
- `src/services/bot.ts`: Competitive AI bot implementation
- `src/services/matchmaking.ts`: Player matching system
- `src/services/websocket.ts`: WebSocket connection handling
- `src/services/database.ts`: PostgreSQL data access layer
- `src/services/kafka.ts`: Event producer for analytics
- `src/routes/api.ts`: HTTP API routes
- `src/types/index.ts`: TypeScript type definitions

### Frontend (React)
Located in `frontend/`:
- Vite-powered React application
- WebSocket client for real-time gameplay
- Interactive game board UI component
- Live leaderboard display
- Custom WebSocket hook

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
- [2025-10-19] **Major refactor**: Converted Go backend to Node.js/TypeScript
- [2025-10-19] Implemented proper environment variable management with .env support
- [2025-10-19] Added TypeScript for type safety and better developer experience
- [2025-10-19] Structured backend with clean service-based architecture
- [2025-10-19] Backend now serves built frontend (single-server deployment)
- [2025-10-19] Database and Kafka made optional for flexible deployment

## Development

### Running Locally
The application runs as a single server on port 5000:
- Backend serves both API and WebSocket on port 5000
- Frontend is built and served statically by the backend
- WebSocket endpoint: `ws://localhost:5000/ws`
- API endpoints: `http://localhost:5000/api/*`

### Environment Variables
The application uses environment variables for configuration (all optional):
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string (optional)
- `KAFKA_ENABLED`: Enable Kafka events (default: false)
- `KAFKA_BROKER`: Kafka broker address
- `MATCHMAKING_TIMEOUT`: Time before pairing with bot (default: 10000ms)
- `RECONNECTION_TIMEOUT`: Reconnection window (default: 30000ms)
- `SESSION_SECRET`: Session management secret

### Best Practices Implemented
- ✅ TypeScript for type safety
- ✅ Environment variable management with dotenv
- ✅ Graceful shutdown handling
- ✅ Service-based architecture
- ✅ Optional dependencies (DB, Kafka)
- ✅ Comprehensive error handling
- ✅ Clean separation of concerns

## User Preferences
- Language: **Node.js/TypeScript** for backend, React for frontend
- Focus on clean code architecture and best practices
- Strategic AI for competitive gameplay
- Real-time performance priority
- Proper environment variable management
