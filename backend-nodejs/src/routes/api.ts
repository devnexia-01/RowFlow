import { Router, Request, Response } from 'express';
import { WebSocketHandlerState, getLeaderboard } from '../services/websocket.js';

export function createApiRouter(wsHandler: WebSocketHandlerState): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
      const leaderboard = await getLeaderboard(wsHandler);
      res.json(leaderboard);
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  return router;
}
