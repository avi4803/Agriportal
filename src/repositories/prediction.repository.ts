import { prisma } from '../config/prisma.js';
import { Prediction, Prisma } from '@prisma/client';

export class PredictionRepository {
  async createMany(
    predictions: { telemetryId: bigint; type: string; value: number; meta?: Prisma.InputJsonValue }[]
  ): Promise<number> {
    const res = await prisma.prediction.createMany({
      data: predictions,
    });
    return res.count;
  }

  async findPaginated(params: {
    deviceId?: string;
    type?: string;
    from?: Date;
    to?: Date;
    cursor?: string;
    take?: number;
  }): Promise<Prediction[]> {
    const limit = params.take || 50;
    const where: Prisma.PredictionWhereInput = {};

    if (params.deviceId) {
      where.telemetry = { deviceId: params.deviceId };
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }

    return prisma.prediction.findMany({
      where,
      take: limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { telemetry: true },
    });
  }
}

export const predictionRepository = new PredictionRepository();
