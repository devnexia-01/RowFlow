import * as DatabaseConfig from '../config/database.js';
import { LeaderboardEntry } from '../types/index.js';

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  return await DatabaseConfig.getLeaderboard();
};

export {
  getLeaderboard,
};
