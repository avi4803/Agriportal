import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireFarmRole } from '../middlewares/farm-role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { exportQuerySchema } from '../validators/export.schema.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJwt);
router.get('/', requireFarmRole(Role.VIEWER), validateRequest(exportQuerySchema), exportController.exportTelemetry);

export default router;
