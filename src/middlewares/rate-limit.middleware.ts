import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Ingestion rate limiter: High throughput keyed by device token / IP
export const ingestionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // Up to 10 packets/second per device node
  keyGenerator: (req: Request) => (req.headers['x-device-token'] as string) || req.ip || 'anonymous',
  message: {
    status: 429,
    message: 'Too many telemetry packets from this device. Please increase transmission interval.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User-facing API limiter: Protect against brute-force & denial of service
export const userFacingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  keyGenerator: (req: Request) => (req.user?.id) || req.ip || 'anonymous',
  message: {
    status: 429,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
