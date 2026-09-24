import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const getAlertsQuerySchema = z.object({
  params: z.object({
    farmId: z.string().uuid(),
  }),
  query: z.object({
    acknowledged: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    cursor: z.string().optional(),
    take: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
  }),
});
