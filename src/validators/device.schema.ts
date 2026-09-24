import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const createDeviceSchema = z.object({
  params: z.object({
    farmId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2, 'Device name must be at least 2 characters'),
    parcelId: z.string().uuid().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export const updateDeviceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    parcelId: z.string().uuid().nullable().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    status: z.enum(['ONLINE', 'OFFLINE']).optional(),
  }),
});
