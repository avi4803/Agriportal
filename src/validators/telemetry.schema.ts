import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ingestTelemetrySchema = z.object({
  body: z.object({
    recordedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
    payload: z.record(z.any()).refine(
      (data) => {
        // Enforce numeric values for known sensor keys if present
        const numericKeys = [
          'temp',
          'humidity',
          'canopyTemp',
          'topsoilMoisture',
          'deepSoilMoisture',
          'leafWetness',
          'npkN',
          'npkP',
          'npkK',
          'solarRadiation',
          'batteryLevel'
        ];
        for (const k of numericKeys) {
          if (data[k] !== undefined && data[k] !== null && isNaN(Number(data[k]))) {
            return false;
          }
        }
        return true;
      },
      { message: 'Known sensor readings must be valid numbers' }
    ),
  }),
});

export const getTelemetryQuerySchema = z.object({
  query: z.object({
    deviceId: z.string().uuid().optional(),
    farmId: z.string().uuid().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    cursor: z.string().optional(),
    take: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
  }),
});
