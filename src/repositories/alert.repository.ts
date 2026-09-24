import { prisma } from '../config/prisma.js';
import { Alert, Severity, Prisma } from '@prisma/client';

export class AlertRepository {
  async create(data: {
    ruleId?: string;
    deviceId?: string;
    severity: Severity;
    message: string;
  }): Promise<Alert> {
    return prisma.alert.create({
      data: {
        ruleId: data.ruleId,
        deviceId: data.deviceId,
        severity: data.severity,
        message: data.message,
      },
    });
  }

  async listByFarmId(params: {
    farmId: string;
    acknowledged?: boolean;
    cursor?: string;
    take?: number;
  }): Promise<Alert[]> {
    const limit = params.take || 50;
    const where: Prisma.AlertWhereInput = {
      rule: { farmId: params.farmId },
    };

    if (params.acknowledged !== undefined) {
      where.acknowledged = params.acknowledged;
    }

    return prisma.alert.findMany({
      where,
      take: limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { rule: true },
    });
  }

  async acknowledge(id: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id },
      data: { acknowledged: true },
    });
  }
}

export const alertRepository = new AlertRepository();
