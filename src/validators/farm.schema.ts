import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const createFarmSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Farm name must be at least 2 characters'),
  }),
});

export const createParcelSchema = z.object({
  params: z.object({
    farmId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1, 'Parcel name is required'),
    cropType: z.string().optional(),
    plantedAt: z.string().datetime().optional(),
  }),
});

export const farmMemberSchema = z.object({
  params: z.object({
    farmId: z.string().uuid(),
    userId: z.string().uuid().optional(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'VIEWER']),
  }),
});
