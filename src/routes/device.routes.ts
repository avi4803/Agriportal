import { Router } from 'express';
import * as deviceController from '../controllers/device.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { updateDeviceSchema } from '../validators/device.schema.js';

const router = Router();

router.use(authenticateJwt);

router.patch('/:id', validateRequest(updateDeviceSchema), deviceController.updateDevice);
router.patch('/:id/rotate-token', deviceController.rotateToken);
router.get('/:id/capabilities', deviceController.getCapabilities);

export default router;
