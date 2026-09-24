import { prisma } from '../config/prisma.js';
import { NotificationPreference, Severity } from '@prisma/client';

export class NotificationPreferenceRepository {
  async findByUserAndFarm(userId: string, farmId: string): Promise<NotificationPreference | null> {
    return prisma.notificationPreference.findUnique({
      where: {
        userId_farmId: { userId, farmId },
      },
    });
  }

  async upsert(data: {
    userId: string;
    farmId: string;
    minSeverity: Severity;
    channels: string[];
  }): Promise<NotificationPreference> {
    return prisma.notificationPreference.upsert({
      where: {
        userId_farmId: { userId: data.userId, farmId: data.farmId },
      },
      update: {
        minSeverity: data.minSeverity,
        channels: data.channels,
      },
      create: {
        userId: data.userId,
        farmId: data.farmId,
        minSeverity: data.minSeverity,
        channels: data.channels,
      },
    });
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
