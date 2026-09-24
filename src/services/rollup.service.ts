import { prisma } from '../config/prisma.js';
import { telemetryRollupRepository } from '../repositories/telemetry-rollup.repository.js';
import { logger } from '../utils/logger.js';

export class RollupService {
  /**
   * Nightly downsampling job: Aggregates raw telemetry older than 30 days into hourly buckets.
   */
  async runNightlyRollup(cutoffDays = 30): Promise<void> {
    logger.info('Starting nightly telemetry downsampling rollup...');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);

    try {
      // Query raw telemetry records older than cutoffDate
      const oldRecords = await prisma.telemetry.findMany({
        where: { recordedAt: { lt: cutoffDate } },
        take: 5000,
        orderBy: { recordedAt: 'asc' },
      });

      if (!oldRecords.length) {
        logger.info('No older records to roll up.');
        return;
      }

      // Group by deviceId + hour bucket + metric key
      const map = new Map<string, { sum: number; min: number; max: number; count: number; deviceId: string; bucketAt: Date; key: string }>();

      for (const rec of oldRecords) {
        const payload = rec.payload as Record<string, any>;
        const bucketAt = new Date(rec.recordedAt);
        bucketAt.setMinutes(0, 0, 0);

        for (const [key, val] of Object.entries(payload)) {
          const num = Number(val);
          if (!isNaN(num) && typeof val !== 'boolean') {
            const compositeKey = `${rec.deviceId}_${bucketAt.toISOString()}_${key}`;
            if (!map.has(compositeKey)) {
              map.set(compositeKey, {
                sum: num,
                min: num,
                max: num,
                count: 1,
                deviceId: rec.deviceId,
                bucketAt,
                key,
              });
            } else {
              const entry = map.get(compositeKey)!;
              entry.sum += num;
              entry.min = Math.min(entry.min, num);
              entry.max = Math.max(entry.max, num);
              entry.count++;
            }
          }
        }
      }

      for (const entry of map.values()) {
        await telemetryRollupRepository.upsertRollup({
          deviceId: entry.deviceId,
          bucketAt: entry.bucketAt,
          metricKey: entry.key,
          avgValue: Math.round((entry.sum / entry.count) * 100) / 100,
          minValue: entry.min,
          maxValue: entry.max,
          sampleCount: entry.count,
        });
      }

      logger.info({ aggregatedEntries: map.size }, 'Nightly rollup job completed successfully');
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed executing nightly rollup');
    }
  }
}

export const rollupService = new RollupService();
