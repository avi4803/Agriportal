import { Router } from 'express';
import * as telemetryController from '../controllers/telemetry.controller.js';
import { authenticateDevice } from '../middlewares/device-auth.middleware.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { ingestionLimiter } from '../middlewares/rate-limit.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { ingestTelemetrySchema, getTelemetryQuerySchema } from '../validators/telemetry.schema.js';

const router = Router();

// Device node telemetry ingestion: High throughput, device-auth, 202 Accepted
router.post(
  '/',
  ingestionLimiter,
  authenticateDevice,
  validateRequest(ingestTelemetrySchema),
  telemetryController.ingest
);

// Historical telemetry retrieval
router.get(
  '/',
  authenticateJwt,
  validateRequest(getTelemetryQuerySchema),
  telemetryController.getTelemetry
);

export default router;
