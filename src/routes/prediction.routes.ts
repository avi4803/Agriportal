import { Router } from 'express';
import * as predictionController from '../controllers/prediction.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.get('/', predictionController.getPredictions);

export default router;
