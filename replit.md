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
- `src/services/game.ts`: Core game logic and board state (functional)
- `src/services/bot.ts`: Competitive AI bot implementation (functional)
- `src/services/matchmaking.ts`: Player matching system (functional with state)
- `src/services/websocket.ts`: WebSocket connection handling (functional with state)
- `src/services/database.ts`: PostgreSQL data access layer (functional)
- `src/services/kafka.ts`: Event producer for analytics (functional)
- `src/routes/api.ts`: HTTP API routes
- `src/types/index.ts`: TypeScript type definitions

**Architecture Pattern**: All services use **function-based approach** instead of classes:
- Pure functions for stateless logic (game, bot)
- Factory functions with closures for stateful modules (database, kafka, websocket, matchmaking)
- Immutable state patterns where possible
- Separation of concerns with small, focused functions

### Frontend (React)
Located in `frontend/`:
- Vite-powered React application
- **Functional components** with React Hooks (useState, useEffect)
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
- ⚠️  Reconnection support (placeholder - needs full implementation)

### Competitive Bot
- ✅ Strategic move selection
- ✅ Blocking opponent wins
- ✅ Creating winning paths
- ✅ Minimax-style decision making

### Persistence & Analytics
- ✅ PostgreSQL for completed games (optional)
- ✅ Player statistics tracking
- ✅ Leaderboard with wins count
- ✅ Kafka events for game analytics (optional)

### DevOps
- ✅ Replit deployment configuration
- ✅ Autoscale deployment target
- ✅ Build and production optimizations

## Recent Changes
- [2025-10-20] **Refactored all backend services from classes to functional approach**
- [2025-10-20] Converted database, kafka, websocket, matchmaking to use functions and closures
- [2025-10-20] Converted game and bot to use pure functions
- [2025-10-20] Updated all imports and dependencies to use functional modules
- [2025-10-20] Verified React components already use functional components with hooks
- [2025-10-20] Set up Replit environment with Node.js 20
- [2025-10-20] Configured deployment for autoscale with build steps
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
- `DATABASE_URL`: PostgreSQL connection string (optional - app works without it)
- `KAFKA_ENABLED`: Enable Kafka events (default: false)
- `KAFKA_BROKER`: Kafka broker address (only needed if KAFKA_ENABLED=true)
- `MATCHMAKING_TIMEOUT`: Time before pairing with bot (default: 10000ms)
- `RECONNECTION_TIMEOUT`: Reconnection window (default: 30000ms)
- `SESSION_SECRET`: Session management secret

**Note**: To enable database persistence, set `DATABASE_URL` environment variable. To enable Kafka analytics, set `KAFKA_ENABLED=true` and provide `KAFKA_BROKER` address. The application gracefully degrades and runs perfectly without either.

### Best Practices Implemented
- ✅ **Functional programming approach** throughout the codebase
- ✅ **React Hooks** for all frontend components (no class components)
- ✅ TypeScript for type safety
- ✅ Environment variable management with dotenv
- ✅ Graceful shutdown handling
- ✅ Service-based architecture with functional modules
- ✅ Optional dependencies (DB, Kafka)
- ✅ Comprehensive error handling
- ✅ Clean separation of concerns
- ✅ Immutable state patterns
- ✅ Pure functions for business logic

## User Preferences
- **Coding Style**: Function-based methods (no classes)
- **Backend**: Node.js/TypeScript with functional programming approach
- **Frontend**: React with functional components and hooks
- Focus on clean code architecture and best practices
- Strategic AI for competitive gameplay
- Real-time performance priority
- Proper environment variable management
