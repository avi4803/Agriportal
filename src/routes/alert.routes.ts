import { Router } from 'express';
import * as alertController from '../controllers/alert.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.patch('/:id/acknowledge', alertController.acknowledgeAlert);

export default router;
