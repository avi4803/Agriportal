import express from 'express';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { helmetMiddleware, corsMiddleware } from './middlewares/security.middleware.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { userFacingLimiter } from './middlewares/rate-limit.middleware.js';

// Import Routes
import authRoutes from './routes/auth.routes.js';
import farmRoutes from './routes/farm.routes.js';
import deviceRoutes from './routes/device.routes.js';
import telemetryRoutes from './routes/telemetry.routes.js';
import predictionRoutes from './routes/prediction.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import alertRoutes from './routes/alert.routes.js';
import exportRoutes from './routes/export.routes.js';
import { docsRouter } from './docs/openapi.js';

export function createApp() {
  const app = express();

  // Core Hardening & Parsers
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Structured Logging with Request-ID correlation
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    })
  );

  // Healthcheck endpoint (excluded from user rate limiting)
  app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // OpenAPI Specification & Swagger UI
  app.use('/api/v1/docs', docsRouter);

  // Apply User-Facing Rate Limiter
  app.use('/api/v1/auth', userFacingLimiter, authRoutes);
  app.use('/api/v1/farms', userFacingLimiter, farmRoutes);
  app.use('/api/v1/devices', userFacingLimiter, deviceRoutes);
  app.use('/api/v1/predictions', userFacingLimiter, predictionRoutes);
  app.use('/api/v1/rules', userFacingLimiter, ruleRoutes);
  app.use('/api/v1/alerts', userFacingLimiter, alertRoutes);
  app.use('/api/v1/export', userFacingLimiter, exportRoutes);

  // Telemetry Route (Own rate limiter applied inside route file: ingestionLimiter for POST)
  app.use('/api/v1/telemetry', telemetryRoutes);

  // Global Error Handler (Registered last, 4-arg signature)
  app.use(errorHandler);

  return app;
}
