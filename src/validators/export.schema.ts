import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const exportQuerySchema = z.object({
  query: z.object({
    farmId: z.string().uuid(),
    from: z.string().datetime(),
    to: z.string().datetime(),
    format: z.enum(['csv', 'parquet']).default('csv'),
  }),
});
