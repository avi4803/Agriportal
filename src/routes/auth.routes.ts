import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh);

export default router;
