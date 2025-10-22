# 🎯 4 in a Row - Real-Time Multiplayer Game

## Overview
A real-time multiplayer implementation of the classic "4 in a Row" (Connect Four) game built with modern web technologies and best practices.

**Tech Stack:**
- **Backend**: **Dual Implementation** - Node.js/TypeScript AND Go (interchangeable)
  - Node.js with TypeScript, Express, and WebSocket support (default, port 5000)
  - Go 1.24 with gorilla/mux and gorilla/websocket (alternative, port 8080)
- **Frontend**: React with Vite
- **Database**: PostgreSQL (optional, works without it)
- **Message Queue**: Kafka for analytics events (optional)
- **Package Manager**: npm (Node.js), go modules (Go)
- **Runtime**: Node.js 20 and Go 1.24

## Project Architecture

This project now includes **TWO complete backend implementations** that are interchangeable:
1. **Node.js/TypeScript Backend** (default, currently running)
2. **Go Backend** (alternative implementation)

Both backends share identical contracts (WebSocket messages, REST API, database schema). See `BACKEND_SWITCHING.md` for details on switching between them.

### Backend Option 1: Node.js/TypeScript (Default)
Located in `backend-nodejs/src/`:
```
src/
├── config/
│   ├── env.ts              # Environment variable management
│   ├── database.ts         # PostgreSQL connection and queries
│   └── kafka.ts            # Kafka producer for analytics events
├── controllers/
│   ├── gameController.ts   # WebSocket game controller
│   └── userController.ts   # User/leaderboard controller
├── middleware/
│   └── errorHandler.ts     # Express error handling middleware
├── modules/
│   ├── game/
│   │   ├── game.service.ts # Core game logic and bot AI
│   │   └── game.types.ts   # Game type definitions
│   └── matchmaking/
│       ├── matchmaking.service.ts  # Player matching system
│       └── matchmaking.types.ts    # Matchmaking types
├── routes/
│   └── api.ts              # HTTP API routes
├── types/
│   └── index.ts            # Shared type definitions
├── utils/
│   └── logger.ts           # Logging utilities
└── index.ts                # Main server entry point
```

**Architecture Pattern**: Layered architecture with **function-based approach**:
- **Config Layer**: Environment variables, database, and external service connections
- **Controllers**: Handle HTTP requests and WebSocket connections
- **Modules**: Domain logic organized by feature (game, matchmaking)
- **Middleware**: Express middleware for cross-cutting concerns
- **Utils**: Shared utility functions
- **Export Pattern**: Functions declared first, exported at end of file
- Pure functions for stateless logic (game mechanics, bot AI)
- Factory functions with closures for stateful services
- Immutable state patterns where possible
- Clean separation of concerns with focused, single-responsibility modules

### Backend Option 2: Go (Alternative)
Located in `backend-go/`:
```
backend-go/
├── cmd/server/          # Main server entry point
├── internal/
│   ├── game/           # Core game logic and board
│   ├── bot/            # AI bot implementation
│   ├── matchmaking/    # Player matching system
│   ├── websocket/      # WebSocket handler & hub
│   ├── database/       # PostgreSQL data layer
│   └── kafka/          # Event producer
└── go.mod
```

**Architecture Pattern**: Idiomatic Go with packages:
- **cmd/server**: Application entry point and server setup
- **internal/game**: Core game logic with pure functions
- **internal/bot**: AI bot with strategic decision-making
- **internal/matchmaking**: Concurrent matchmaking with sync.RWMutex
- **internal/websocket**: Hub pattern for WebSocket connections
- **internal/database**: PostgreSQL repository layer
- **internal/kafka**: Kafka producer for analytics
- Native Go concurrency with goroutines and channels
- Interface-based design for testability
- Thread-safe with proper synchronization

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
- ✅ Docker containerization with multi-stage builds
- ✅ Docker Compose for local development
- ✅ Kubernetes manifests for production deployment
- ✅ Horizontal Pod Autoscaling (HPA)
- ✅ Ingress with TLS support

## Recent Changes
- [2025-10-22] **Added Docker and Kubernetes support** for container deployment
- [2025-10-22] Created Dockerfiles for all services with multi-stage builds
- [2025-10-22] Implemented docker-compose.yml for local development stack
- [2025-10-22] Created complete Kubernetes manifests (deployments, services, ingress, HPA)
- [2025-10-22] Added comprehensive DEPLOYMENT.md documentation
- [2025-10-22] Configured autoscaling and health checks for K8s
- [2025-10-22] Fixed concurrency bug in Go WebSocket hub (broadcast map mutation)
- [2025-10-22] **Added complete Go backend implementation** as alternative to Node.js
- [2025-10-22] Implemented full Go backend with same functionality as Node.js backend
- [2025-10-22] Created backend-go/ directory with Go 1.24, gorilla/mux, gorilla/websocket
- [2025-10-22] Implemented game logic, bot AI, matchmaking, WebSocket hub in Go
- [2025-10-22] Added PostgreSQL and Kafka support to Go backend
- [2025-10-22] Both backends now share identical contracts (WebSocket, REST API, DB schema)
- [2025-10-22] Created BACKEND_SWITCHING.md documentation for switching between backends
- [2025-10-22] Updated replit.md to reflect dual-backend architecture
- [2025-10-22] Installed Go 1.24 and all required dependencies
- [2025-10-22] Node.js backend remains default and currently running on port 5000
- [2025-10-20] **Restructured backend to layered architecture with proper separation of concerns**
- [2025-10-20] Created config/ layer for environment, database, and Kafka configuration
- [2025-10-20] Created controllers/ for HTTP and WebSocket request handling
- [2025-10-20] Organized domain logic into modules/ (game and matchmaking features)
- [2025-10-20] Added middleware/ for error handling and utils/ for shared utilities
- [2025-10-20] Updated export pattern: functions declared first, then exported at end
- [2025-10-20] All code follows functional programming approach with no classes
- [2025-10-20] Removed old services/ directory, migrated to new structure
- [2025-10-20] Set up Replit environment with Node.js 20
- [2025-10-20] Configured deployment for autoscale with build steps
- [2025-10-20] Server running successfully on port 5000 with WebSocket support
- [2025-10-19] **Major refactor**: Converted Go backend to Node.js/TypeScript
- [2025-10-19] Implemented proper environment variable management with .env support
- [2025-10-19] Added TypeScript for type safety and better developer experience
- [2025-10-19] Structured backend with clean service-based architecture
- [2025-10-19] Backend now serves built frontend (single-server deployment)
- [2025-10-19] Database and Kafka made optional for flexible deployment

## Development

### Running Locally

#### Replit Development (Default)
The application runs as a single server on port 5000:
- Backend serves both API and WebSocket on port 5000
- Frontend is built and served statically by the backend
- WebSocket endpoint: `ws://localhost:5000/ws`
- API endpoints: `http://localhost:5000/api/*`

#### Docker Development
Use Docker Compose for a complete local stack:
```bash
docker-compose up --build
```
This starts PostgreSQL, Kafka, backend, and frontend in containers.

#### Kubernetes Deployment
Deploy to any Kubernetes cluster:
```bash
kubectl apply -f k8s/
```
See `DEPLOYMENT.md` for complete deployment instructions.

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
