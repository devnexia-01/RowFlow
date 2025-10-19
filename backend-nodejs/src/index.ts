import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from './services/database.js';
import { KafkaProducer } from './services/kafka.js';
import { WebSocketHandler } from './services/websocket.js';
import { createApiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function main() {
  console.log('🚀 Starting 4 in a Row server...');
  console.log(`Environment: ${NODE_ENV}`);

  // Initialize services
  const db = new Database();
  await db.initialize();

  const kafka = new KafkaProducer();
  await kafka.connect();

  // Create Express app
  const app = express();
  const server = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // Initialize WebSocket handler
  const wsHandler = new WebSocketHandler(wss, db, kafka);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API routes
  app.use('/api', createApiRouter(wsHandler));

  // Serve static frontend files
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Serve index.html for all other routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  // Start server
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`   HTTP: http://0.0.0.0:${PORT}`);
    console.log(`   WebSocket: ws://0.0.0.0:${PORT}/ws`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await kafka.disconnect();
    await db.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await kafka.disconnect();
    await db.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
