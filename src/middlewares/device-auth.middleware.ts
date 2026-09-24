import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../errors/AppError.js';
import { deviceRepository } from '../repositories/device.repository.js';

export const authenticateDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawToken = req.headers['x-device-token'] as string;
    if (!rawToken) {
      throw AppError.unauthorized('Missing x-device-token header');
    }

    // SHA-256 hash of incoming device token
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const device = await deviceRepository.findByHashedToken(hashedToken);
    if (!device) {
      throw AppError.unauthorized('Invalid device token');
    }

    req.device = {
      id: device.id,
      farmId: device.farmId,
      name: device.name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
