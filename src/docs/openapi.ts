import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.schema.js';
import { createFarmSchema, createParcelSchema, farmMemberSchema } from '../validators/farm.schema.js';
import { createDeviceSchema, updateDeviceSchema } from '../validators/device.schema.js';
import { ingestTelemetrySchema, getTelemetryQuerySchema } from '../validators/telemetry.schema.js';
import { createRuleSchema, updateRuleSchema } from '../validators/rule.schema.js';
import { getAlertsQuerySchema } from '../validators/alert.schema.js';
import { exportQuerySchema } from '../validators/export.schema.js';

export const registry = new OpenAPIRegistry();

// Security Schemas
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT authorization header (format: Bearer <token>)',
});

registry.registerComponent('securitySchemes', 'deviceAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'x-device-token',
  description: 'Hardware node provisioning token',
});

// 1. Auth Paths
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Auth'],
  summary: 'Register new operator user',
  request: { body: { content: { 'application/json': { schema: registerSchema.shape.body } } } },
  responses: { 201: { description: 'User registered successfully' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Auth'],
  summary: 'Authenticate operator user',
  request: { body: { content: { 'application/json': { schema: loginSchema.shape.body } } } },
  responses: { 200: { description: 'Authenticated successfully' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh access token',
  request: { body: { content: { 'application/json': { schema: refreshTokenSchema.shape.body } } } },
  responses: { 200: { description: 'Access token refreshed' } },
});

// 2. Farm Paths
registry.registerPath({
  method: 'post',
  path: '/api/v1/farms',
  tags: ['Farms'],
  summary: 'Create a new farm (assigns creator as OWNER)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: createFarmSchema.shape.body } } } },
  responses: { 201: { description: 'Farm created' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/farms',
  tags: ['Farms'],
  summary: 'List all farms current user is a member of',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of farms' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/farms/{farmId}',
  tags: ['Farms'],
  summary: 'Get details of a specific farm',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Farm details' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/farms/{farmId}/parcels',
  tags: ['Farms'],
  summary: 'Create a new parcel zone within a farm (Role: ADMIN+)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: createParcelSchema.shape.body } } } },
  responses: { 201: { description: 'Parcel created' } },
});

// 3. Farm Members (Team Access)
registry.registerPath({
  method: 'get',
  path: '/api/v1/farms/{farmId}/members',
  tags: ['Team & Members'],
  summary: 'List team members of a farm',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Farm members' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/farms/{farmId}/members',
  tags: ['Team & Members'],
  summary: 'Invite a user to farm with a specific role (Role: OWNER)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: farmMemberSchema.shape.body } } } },
  responses: { 201: { description: 'User invited' } },
});

// 4. Device Management
registry.registerPath({
  method: 'post',
  path: '/api/v1/farms/{farmId}/devices',
  tags: ['Devices'],
  summary: 'Provision a new sensor node (returns raw token ONCE) (Role: ADMIN+)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: createDeviceSchema.shape.body } } } },
  responses: { 201: { description: 'Device provisioned and raw token returned' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/farms/{farmId}/devices',
  tags: ['Devices'],
  summary: 'List devices attached to a farm',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'List of devices' } },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/devices/{id}',
  tags: ['Devices'],
  summary: 'Update device metadata / assigned parcel (Role: ADMIN+)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: updateDeviceSchema.shape.body } } } },
  responses: { 200: { description: 'Device updated' } },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/devices/{id}/rotate-token',
  tags: ['Devices'],
  summary: 'Rotate compromised device token (Role: OWNER)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'New raw device token returned once' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/devices/{id}/capabilities',
  tags: ['Devices'],
  summary: 'Check unlocked agronomic capabilities and missing sensor keys (for frontend badges)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Capability unlock status' } },
});

// 5. Telemetry & Ingestion Buffer
registry.registerPath({
  method: 'post',
  path: '/api/v1/telemetry',
  tags: ['Telemetry'],
  summary: 'Ingest node sensor readings (Node device API with x-device-token header)',
  security: [{ deviceAuth: [] }],
  request: { body: { content: { 'application/json': { schema: ingestTelemetrySchema.shape.body } } } },
  responses: { 202: { description: 'Telemetry accepted for asynchronous batch buffering' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/telemetry',
  tags: ['Telemetry'],
  summary: 'List historical telemetry with cursor pagination',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Paginated telemetry records' } },
});

// 6. Agronomic Predictions
registry.registerPath({
  method: 'get',
  path: '/api/v1/predictions',
  tags: ['Predictions'],
  summary: 'Query agronomic predictions (VPD, CWSI, Fungal Risk, NPK status)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Paginated predictions' } },
});

// 7. Rules & Alerts
registry.registerPath({
  method: 'post',
  path: '/api/v1/farms/{farmId}/rules',
  tags: ['Rules & Alerts'],
  summary: 'Create custom threshold monitoring rule (Role: ADMIN+)',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: createRuleSchema.shape.body } } } },
  responses: { 201: { description: 'Rule created' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/farms/{farmId}/rules',
  tags: ['Rules & Alerts'],
  summary: 'List all rules for a farm',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Rules list' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/farms/{farmId}/alerts',
  tags: ['Rules & Alerts'],
  summary: 'List alerts triggered by rules',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Paginated alerts' } },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/alerts/{id}/acknowledge',
  tags: ['Rules & Alerts'],
  summary: 'Acknowledge an alert',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Alert acknowledged' } },
});

// 8. ML Dataset Export
registry.registerPath({
  method: 'get',
  path: '/api/v1/export',
  tags: ['ML Dataset Export'],
  summary: 'Stream joined Telemetry and Prediction dataset in CSV or JSONL format',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Streaming export dataset' } },
});

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'AgriPortal Production REST API',
      version: '1.0.0',
      description: 'Single-source-of-truth agronomic monitoring & IoT gateway API',
    },
    servers: [{ url: 'http://localhost:4000' }],
  });
}

export const docsRouter = Router();
const openApiDoc = generateOpenApiSpec();

docsRouter.get('/openapi.json', (req, res) => res.json(openApiDoc));
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(openApiDoc));
