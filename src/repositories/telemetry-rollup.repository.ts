import { prisma } from '../config/prisma.js';
import { TelemetryRollup } from '@prisma/client';

export class TelemetryRollupRepository {
  async upsertRollup(data: {
    deviceId: string;
    bucketAt: Date;
    metricKey: string;
    avgValue: number;
    minValue: number;
    maxValue: number;
    sampleCount: number;
  }): Promise<TelemetryRollup> {
    return prisma.telemetryRollup.upsert({
      where: {
        deviceId_bucketAt_metricKey: {
          deviceId: data.deviceId,
          bucketAt: data.bucketAt,
          metricKey: data.metricKey,
        },
      },
      update: {
        avgValue: data.avgValue,
        minValue: data.minValue,
        maxValue: data.maxValue,
        sampleCount: data.sampleCount,
      },
      create: data,
    });
  }
}

export const telemetryRollupRepository = new TelemetryRollupRepository();
