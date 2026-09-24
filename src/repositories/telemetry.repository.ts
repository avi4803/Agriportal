import { prisma } from '../config/prisma.js';
import { Telemetry, Prisma } from '@prisma/client';

export class TelemetryRepository {
  async createMany(
    records: { deviceId: string; recordedAt: Date; payload: Prisma.InputJsonValue }[]
  ): Promise<number> {
    const result = await prisma.telemetry.createMany({
      data: records,
      skipDuplicates: true, // Idempotency via @@unique([deviceId, recordedAt])
    });
    return result.count;
  }

  async findRecent(deviceId: string, limit = 5): Promise<Telemetry[]> {
    return prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async findPaginated(params: {
    deviceId?: string;
    farmId?: string;
    from?: Date;
    to?: Date;
    cursor?: string;
    take?: number;
  }): Promise<Telemetry[]> {
    const limit = params.take || 50;
    const where: Prisma.TelemetryWhereInput = {};

    if (params.deviceId) {
      where.deviceId = params.deviceId;
    } else if (params.farmId) {
      where.device = { farmId: params.farmId, deletedAt: null };
    }

    if (params.from || params.to) {
      where.recordedAt = {};
      if (params.from) where.recordedAt.gte = params.from;
      if (params.to) where.recordedAt.lte = params.to;
    }

    return prisma.telemetry.findMany({
      where,
      take: limit + 1,
      cursor: params.cursor ? { id: BigInt(params.cursor) } : undefined,
      orderBy: { id: 'desc' },
      include: { predictions: true },
    });
  }

  async findForExportBatch(params: {
    farmId: string;
    from: Date;
    to: Date;
    cursor?: bigint;
    take: number;
  }) {
    return prisma.telemetry.findMany({
      where: {
        device: { farmId: params.farmId },
        recordedAt: { gte: params.from, lte: params.to },
      },
      take: params.take,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : 0,
      orderBy: { id: 'asc' },
      include: {
        device: { select: { id: true, name: true } },
        predictions: true,
      },
    });
  }
}

export const telemetryRepository = new TelemetryRepository();
