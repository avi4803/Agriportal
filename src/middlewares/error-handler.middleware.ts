import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });
  }

  // Unexpected internal errors: Log full stack and shield details from client
  logger.error({
    err,
    path: req.originalUrl,
    method: req.method,
    headers: req.headers,
  }, 'Unhandled Application Error');

  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error',
  });
};
