import { Router } from 'express';
import * as farmController from '../controllers/farm.controller.js';
import * as farmMemberController from '../controllers/farm-member.controller.js';
import * as deviceController from '../controllers/device.controller.js';
import * as ruleController from '../controllers/rule.controller.js';
import * as alertController from '../controllers/alert.controller.js';
import * as notifPrefController from '../controllers/notification-preference.controller.js';
import { authenticateJwt } from '../middlewares/auth.middleware.js';
import { requireFarmRole } from '../middlewares/farm-role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createFarmSchema, createParcelSchema, farmMemberSchema } from '../validators/farm.schema.js';
import { createDeviceSchema } from '../validators/device.schema.js';
import { createRuleSchema } from '../validators/rule.schema.js';
import { getAlertsQuerySchema } from '../validators/alert.schema.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateJwt);

// Farms
router.post('/', validateRequest(createFarmSchema), farmController.createFarm);
router.get('/', farmController.listFarms);
router.get('/:farmId', requireFarmRole(Role.VIEWER), farmController.getFarm);

// Parcels
router.post('/:farmId/parcels', requireFarmRole(Role.ADMIN), validateRequest(createParcelSchema), farmController.createParcel);

// Farm Members
router.get('/:farmId/members', requireFarmRole(Role.VIEWER), farmMemberController.listMembers);
router.post('/:farmId/members', requireFarmRole(Role.OWNER), validateRequest(farmMemberSchema), farmMemberController.inviteMember);
router.patch('/:farmId/members/:userId', requireFarmRole(Role.OWNER), farmMemberController.updateRole);
router.delete('/:farmId/members/:userId', requireFarmRole(Role.OWNER), farmMemberController.removeMember);

// Devices
router.post('/:farmId/devices', requireFarmRole(Role.ADMIN), validateRequest(createDeviceSchema), deviceController.createDevice);
router.get('/:farmId/devices', requireFarmRole(Role.VIEWER), deviceController.listDevices);

// Rules
router.post('/:farmId/rules', requireFarmRole(Role.ADMIN), validateRequest(createRuleSchema), ruleController.createRule);
router.get('/:farmId/rules', requireFarmRole(Role.VIEWER), ruleController.listRules);

// Alerts
router.get('/:farmId/alerts', requireFarmRole(Role.VIEWER), validateRequest(getAlertsQuerySchema), alertController.listAlerts);

// Notification Preferences
router.get('/:farmId/notification-preferences/me', requireFarmRole(Role.VIEWER), notifPrefController.getMyPreference);
router.put('/:farmId/notification-preferences/me', requireFarmRole(Role.VIEWER), notifPrefController.updateMyPreference);

export default router;
