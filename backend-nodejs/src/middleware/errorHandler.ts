import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logger.js';

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logError('Error occurred:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export {
  errorHandler,
};
