import { prisma } from '../config/prisma.js';
import { Rule, Prisma } from '@prisma/client';

export class RuleRepository {
  async findById(id: string): Promise<Rule | null> {
    return prisma.rule.findUnique({ where: { id } });
  }

  async findActiveByFarmId(farmId: string): Promise<Rule[]> {
    return prisma.rule.findMany({
      where: { farmId, enabled: true },
    });
  }

  async listByFarmId(farmId: string): Promise<Rule[]> {
    return prisma.rule.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(farmId: string, data: { name: string; condition: Prisma.InputJsonValue; action: Prisma.InputJsonValue; enabled?: boolean }): Promise<Rule> {
    return prisma.rule.create({
      data: {
        farmId,
        name: data.name,
        condition: data.condition,
        action: data.action,
        enabled: data.enabled ?? true,
      },
    });
  }

  async update(id: string, data: Prisma.RuleUpdateInput): Promise<Rule> {
    return prisma.rule.update({
      where: { id },
      data,
    });
  }
}

export const ruleRepository = new RuleRepository();
