# 🎮 4 in a Row - Real-Time Multiplayer Game

A modern, real-time implementation of the classic Connect Four game with intelligent bot opponents, multiplayer support, and comprehensive analytics.

## 🌟 Features

### Core Gameplay
- **7×6 Game Board** - Classic Connect Four gameplay
- **Real-Time Multiplayer** - Play against other players via WebSocket
- **Smart Bot Opponent** - AI bot with strategic decision-making
- **Win Detection** - Horizontal, vertical, and diagonal win conditions
- **Reconnection Support** - 30-second window to rejoin games

### Matchmaking System
- Automatic player matching
- 10-second timeout before bot pairing
- Queue management for waiting players

### Competitive Bot AI
- Strategic move selection
- Blocks opponent winning moves
- Creates winning opportunities
- Evaluates board positions using minimax-style logic

### Analytics & Persistence
- **PostgreSQL Database** - Stores game history and player stats
- **Kafka Integration** - Real-time game events streaming
- **Leaderboard** - Live rankings based on wins

### DevOps
- **CI/CD Pipeline** - Automated testing and deployment via GitHub Actions
- **Health Monitoring** - API endpoints for service health checks

## 🏗️ Architecture

### Backend (Go)
```
backend/
├── cmd/server/           # Main server entry point
├── internal/
│   ├── game/            # Core game logic and board
│   ├── bot/             # AI bot implementation
│   ├── matchmaking/     # Player matching system
│   ├── websocket/       # WebSocket handler & hub
│   ├── database/        # PostgreSQL data layer
│   └── kafka/           # Event producer
└── go.mod
```

**Key Technologies:**
- `gorilla/websocket` - Real-time communication
- `gorilla/mux` - HTTP routing
- `lib/pq` - PostgreSQL driver
- `segmentio/kafka-go` - Kafka producer

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── GameBoard.jsx
│   │   └── Leaderboard.jsx
│   ├── hooks/          # Custom React hooks
│   │   └── useWebSocket.js
│   ├── App.jsx         # Main application
│   └── main.jsx        # Entry point
└── package.json
```

**Key Technologies:**
- React 18
- Vite (build tool)
- Native WebSocket API

## 🚀 Getting Started

### Prerequisites
- Go 1.24+
- Node.js 20+
- PostgreSQL database

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host/db
PORT=5000
KAFKA_BROKER=localhost:9092
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fourinrow
```

2. **Install Backend Dependencies**
```bash
cd backend
go mod download
```

3. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

4. **Build the Application**
```bash
# Build backend
cd backend
go build -o server ./cmd/server

# Build frontend
cd frontend
npm run build
```

5. **Run the Server**
```bash
cd backend
PORT=5000 ./server
```

The application will be available at `http://localhost:5000`

## 🎮 How to Play

1. **Join a Game**
   - Enter your username
   - Click "Join Game"
   - Wait for an opponent (or bot after 10 seconds)

2. **Gameplay**
   - Click on any column to drop your disc
   - Discs fall to the lowest available position
   - First to connect 4 wins!

3. **Winning**
   - Connect 4 discs horizontally, vertically, or diagonally
   - If the board fills with no winner, it's a draw

4. **Reconnection**
   - If disconnected, you have 30 seconds to rejoin
   - Use the same username or game ID

## 📊 API Endpoints

### WebSocket
- `ws://host:port/ws` - WebSocket connection for real-time gameplay

**Messages:**
- `join` - Join game with username
- `move` - Make a move (column number)
- `reconnect` - Rejoin existing game

### HTTP
- `GET /api/leaderboard` - Fetch top players
- `GET /api/health` - Health check endpoint

## 🧪 Testing

### Backend Tests
```bash
cd backend
go test -v ./...
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🔧 CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

### Workflows
1. **Backend Testing** - Go tests and build verification
2. **Frontend Testing** - React build verification
3. **Linting** - Code quality checks
4. **Deployment** - Automated deployment to Replit

## 🎯 Game Logic

### Win Conditions
The game checks for 4 connected discs in:
- Horizontal lines (→)
- Vertical lines (↓)
- Diagonal lines (↗↘)

### Bot Strategy
The bot evaluates moves based on:
1. **Immediate wins** - Takes winning moves
2. **Blocking** - Prevents opponent wins
3. **Strategic positioning** - Creates future opportunities
4. **Center preference** - Favors center columns

## 📈 Analytics Events

Kafka events are produced for:
- `game_started` - New game begins
- `move_made` - Player/bot makes a move
- `game_ended` - Game completes with winner

## 🗄️ Database Schema

### Players Table
```sql
CREATE TABLE players (
    username VARCHAR(255) PRIMARY KEY,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Games Table
```sql
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    player1 VARCHAR(255) REFERENCES players(username),
    player2 VARCHAR(255),
    winner VARCHAR(255),
    moves_data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🛠️ Development

### Running in Development

**Terminal 1 - Backend:**
```bash
cd backend
go run ./cmd/server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Hot Reload
- Backend: Use `air` for hot reload
- Frontend: Vite provides automatic hot module replacement

## 🚢 Deployment

The application is configured for deployment on Replit:
- Backend serves on port 5000
- Frontend is built and served by backend
- Environment variables managed via Replit secrets

## 📝 License

MIT License - feel free to use this project for learning or personal use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📞 Support

For questions or issues, please open a GitHub issue.

---

**Enjoy playing 4 in a Row!** 🎉
