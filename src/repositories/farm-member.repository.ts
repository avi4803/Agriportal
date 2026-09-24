import { prisma } from '../config/prisma.js';
import { FarmMember, Role } from '@prisma/client';

export class FarmMemberRepository {
  async findMembership(farmId: string, userId: string): Promise<FarmMember | null> {
    return prisma.farmMember.findUnique({
      where: {
        farmId_userId: { farmId, userId },
      },
      include: { farm: true },
    });
  }

  async listMembers(farmId: string) {
    return prisma.farmMember.findMany({
      where: { farmId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { invitedAt: 'asc' },
    });
  }

  async addMember(farmId: string, userId: string, role: Role): Promise<FarmMember> {
    return prisma.farmMember.create({
      data: {
        farmId,
        userId,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateRole(farmId: string, userId: string, role: Role): Promise<FarmMember> {
    return prisma.farmMember.update({
      where: {
        farmId_userId: { farmId, userId },
      },
      data: { role },
    });
  }

  async removeMember(farmId: string, userId: string): Promise<FarmMember> {
    return prisma.farmMember.delete({
      where: {
        farmId_userId: { farmId, userId },
      },
    });
  }
}

export const farmMemberRepository = new FarmMemberRepository();
