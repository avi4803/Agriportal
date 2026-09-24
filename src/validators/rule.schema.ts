import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const leafConditionSchema = z.object({
  field: z.string(),
  op: z.enum(['lt', 'gt', 'eq', 'lte', 'gte']),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

// Annotate lazy recursive condition tree with openapi metadata to prevent UnknownZodTypeError
export const conditionTreeSchema: z.ZodType<any> = z
  .lazy(() =>
    z.union([
      leafConditionSchema,
      z.object({ all: z.array(conditionTreeSchema) }),
      z.object({ any: z.array(conditionTreeSchema) }),
    ])
  )
  .openapi({
    type: 'object',
    description: 'Condition expression tree supporting all, any, and field comparisons',
  });

export const createRuleSchema = z.object({
  params: z.object({
    farmId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2),
    condition: conditionTreeSchema,
    action: z.object({
      type: z.enum(['ALERT']),
      severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('WARNING'),
      messageTemplate: z.string().optional(),
    }),
    enabled: z.boolean().default(true),
  }),
});

export const updateRuleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    condition: conditionTreeSchema.optional(),
    action: z.any().optional(),
    enabled: z.boolean().optional(),
  }),
});
