import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as DatabaseConfig from './config/database.js';
import * as KafkaConfig from './config/kafka.js';
import { PORT, NODE_ENV } from './config/env.js';
import * as GameController from './controllers/gameController.js';
import { createApiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logInfo, logError } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  logInfo('🚀 Starting 4 in a Row server...');
  logInfo(`Environment: ${NODE_ENV}`);

  DatabaseConfig.createDatabase();
  await DatabaseConfig.initialize();

  KafkaConfig.createKafkaProducer();
  await KafkaConfig.connect();

  const app = express();
  const server = createServer(app);

  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  const wsHandler = GameController.createWebSocketHandler(wss);

  app.use(cors());
  app.use(express.json());

  app.use('/api', createApiRouter());

  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.use(errorHandler);

  server.listen(PORT, '0.0.0.0', () => {
    logInfo(`✅ Server running on port ${PORT}`);
    logInfo(`   HTTP: http://0.0.0.0:${PORT}`);
    logInfo(`   WebSocket: ws://0.0.0.0:${PORT}/ws`);
  });

  process.on('SIGTERM', async () => {
    logInfo('SIGTERM received, shutting down gracefully...');
    await KafkaConfig.disconnect();
    await DatabaseConfig.close();
    server.close(() => {
      logInfo('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logInfo('SIGINT received, shutting down gracefully...');
    await KafkaConfig.disconnect();
    await DatabaseConfig.close();
    server.close(() => {
      logInfo('Server closed');
      process.exit(0);
    });
  });
};

main().catch((error) => {
  logError('Failed to start server:', error);
  process.exit(1);
});
