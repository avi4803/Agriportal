import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { userRepository } from '../repositories/user.repository.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      farmRole?: string;
      device?: { id: string; farmId: string; name: string };
    }
  }
}

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(AppError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
    } else if (err.name === 'JsonWebTokenError') {
      next(AppError.unauthorized('Invalid token', 'INVALID_TOKEN'));
    } else {
      next(err);
    }
  }
};
