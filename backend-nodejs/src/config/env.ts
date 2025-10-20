import 'dotenv/config';

const PORT = parseInt(process.env.PORT || '5000');
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;
const KAFKA_ENABLED = process.env.KAFKA_ENABLED === 'true';
const KAFKA_BROKER = process.env.KAFKA_BROKER;
const RECONNECTION_TIMEOUT = parseInt(process.env.RECONNECTION_TIMEOUT || '30000');
const MATCHMAKING_TIMEOUT = parseInt(process.env.MATCHMAKING_TIMEOUT || '10000');

export {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  KAFKA_ENABLED,
  KAFKA_BROKER,
  RECONNECTION_TIMEOUT,
  MATCHMAKING_TIMEOUT,
};
