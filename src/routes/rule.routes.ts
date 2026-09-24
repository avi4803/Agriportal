import { Router } from 'express';
import * as ruleController from '../controllers/rule.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { updateRuleSchema } from '../validators/rule.schema.js';

const router = Router();

router.use(authenticateJwt);
router.patch('/:id', validateRequest(updateRuleSchema), ruleController.updateRule);

export default router;
