# Backend Switching Guide

This project now supports **two backend implementations** that provide identical functionality:

1. **Node.js/TypeScript Backend** (`backend-nodejs/`) - Default, currently running
2. **Go Backend** (`backend-go/`) - Alternative implementation

Both backends implement the same contracts (WebSocket messages, REST API, database schema) so they can be used interchangeably.

## Architecture Overview

### Node.js Backend
- **Location**: `backend-nodejs/`
- **Language**: TypeScript with Node.js 20
- **Port**: 5000 (default)
- **Key Features**:
  - Functional programming approach
  - ES modules with TypeScript
  - Express.js for HTTP/REST
  - ws library for WebSocket
  - Serves built frontend from `frontend/dist`

### Go Backend
- **Location**: `backend-go/`
- **Language**: Go 1.24
- **Port**: 8080 (default, configurable)
- **Key Features**:
  - Idiomatic Go with goroutines
  - gorilla/mux for routing
  - gorilla/websocket for WebSocket
  - Native concurrency with channels
  - Serves built frontend from `frontend/dist`

## Shared Contracts

Both backends implement identical:

### WebSocket Message Schema
```json
{
  "type": "join|move|gameStart|move|gameEnd|waiting|error",
  "data": { ... },
  "username": "...",
  "column": 0-6,
  "gameId": "uuid"
}
```

### REST API Endpoints
- `GET /api/health` - Health check
- `GET /api/leaderboard` - Top 10 players by wins
- `WS /ws` - WebSocket connection

### Database Schema
- `players` table: username, wins, losses, draws
- `games` table: game_id, player1, player2, winner, moves_data

## How to Switch Backends

### Currently Running: Node.js Backend (Default)

The project is configured to run the Node.js backend by default on port 5000.

**Workflow Configuration**:
```bash
cd backend-nodejs && npm start
```

### Switch to Go Backend

1. **Stop the current workflow** or change the workflow command
2. **Build the Go backend**:
   ```bash
   cd backend-go
   go build -o server ./cmd/server
   ```
3. **Update the workflow**:
   ```bash
   # Option A: Update the existing workflow
   cd backend-go && PORT=5000 ./server
   
   # Option B: Run on different port (8080) and update frontend
   cd backend-go && PORT=8080 ./server
   ```
4. **If using port 8080**, update frontend to connect to the Go backend

### Running Both Backends (Development)

For development, you can run both backends on different ports:

1. **Node.js Backend** on port 5000:
   ```bash
   cd backend-nodejs && npm start
   ```

2. **Go Backend** on port 8080:
   ```bash
   cd backend-go && PORT=8080 ./server
   ```

3. **Frontend** can be configured to connect to either:
   - Port 5000 → Node.js
   - Port 8080 → Go

## Environment Variables

Both backends use the same environment variables:

### Required
- `PORT` - Server port (default: 5000 for Node.js, 8080 for Go)

### Optional (Database & Analytics)
- `DATABASE_URL` - PostgreSQL connection string
- `KAFKA_ENABLED` - Enable Kafka events (true/false)
- `KAFKA_BROKER` - Kafka broker address (default: localhost:9092)
- `MATCHMAKING_TIMEOUT` - Time before bot pairing (default: 10000ms / 10s)
- `RECONNECTION_TIMEOUT` - Reconnection window (default: 30000ms / 30s)
- `NODE_ENV` - Environment (development/production) - Node.js only
- `SESSION_SECRET` - Session secret - Node.js only

## Build & Run Commands

### Node.js Backend
```bash
# Install dependencies
cd backend-nodejs && npm install

# Build TypeScript
npm run build

# Development mode (with watch)
npm run dev

# Production mode
npm start
```

### Go Backend
```bash
# Install dependencies (auto-downloaded on build)
cd backend-go && go mod download

# Build
go build -o server ./cmd/server

# Run
./server

# Or build and run
go run ./cmd/server
```

## Frontend Configuration

The frontend is built once and can be served by either backend:

```bash
cd frontend
npm install
npm run build
```

Both backends serve the built frontend from `frontend/dist/` and handle the WebSocket/API routes.

## Testing

Both backends can be tested with the same test suite (if implemented) since they share identical contracts.

## Deployment

### Deploy Node.js Backend (Default)
Already configured in `.replit` workflow. The system will:
1. Build frontend (`cd frontend && npm run build`)
2. Build backend (`cd backend-nodejs && npm run build`)
3. Start server (`cd backend-nodejs && npm start`)

### Deploy Go Backend
To deploy the Go backend instead:
1. Update the workflow to build and run Go server
2. Ensure `frontend/dist` is built
3. Run `cd backend-go && go build -o server ./cmd/server && ./server`

## Performance Comparison

### Node.js Backend
- **Pros**: Faster development, rich ecosystem, easier debugging
- **Cons**: Single-threaded event loop, higher memory usage

### Go Backend
- **Pros**: Better concurrency, lower memory, compiled binary, faster execution
- **Cons**: Longer compile times, more verbose code

## Which Backend Should I Use?

### Use Node.js Backend if:
- You prefer JavaScript/TypeScript development
- You need rapid iteration and hot reload
- You want extensive npm package ecosystem
- Single-threaded performance is sufficient

### Use Go Backend if:
- You need better concurrency and performance
- You want lower resource usage
- You prefer static typing and compilation
- You're deploying in resource-constrained environments

## Migration Notes

Since both backends share the same database schema and contracts, you can switch between them without data loss. The database and Kafka configurations are identical.

## Current Status

- ✅ **Node.js Backend**: Fully implemented, tested, and running
- ✅ **Go Backend**: Fully implemented, tested
- ✅ **Frontend**: Built and compatible with both backends
- ✅ **Database**: Shared schema, works with both
- ✅ **Kafka**: Shared events, works with both

## Support

For issues specific to:
- Node.js backend: Check `backend-nodejs/` code
- Go backend: Check `backend-go/` code
- Frontend: Check `frontend/` code
- Shared issues: Check this guide and contracts

Both implementations follow the same architecture patterns and game logic, so bugs in one should be replicated and fixed in the other.
