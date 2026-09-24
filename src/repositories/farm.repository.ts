import { prisma } from '../config/prisma.js';
import { Farm, Parcel, Prisma, Role } from '@prisma/client';

export class FarmRepository {
  async findById(id: string): Promise<Farm | null> {
    return prisma.farm.findFirst({
      where: { id, deletedAt: null },
      include: {
        parcels: true,
        devices: { where: { deletedAt: null } },
      },
    });
  }

  async findFarmsByUserId(userId: string): Promise<Farm[]> {
    return prisma.farm.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId },
        },
      },
      include: {
        parcels: true,
        devices: { where: { deletedAt: null } },
      },
    });
  }

  async createWithInitialOwner(
    name: string,
    ownerUserId: string
  ): Promise<{ farm: Farm; membershipId: string }> {
    return prisma.$transaction(async (tx) => {
      const farm = await tx.farm.create({
        data: { name },
      });

      const member = await tx.farmMember.create({
        data: {
          farmId: farm.id,
          userId: ownerUserId,
          role: Role.OWNER,
        },
      });

      return { farm, membershipId: member.id };
    });
  }

  async createParcel(farmId: string, data: { name: string; cropType?: string; plantedAt?: Date }): Promise<Parcel> {
    return prisma.parcel.create({
      data: {
        farmId,
        name: data.name,
        cropType: data.cropType,
        plantedAt: data.plantedAt,
      },
    });
  }

  async softDelete(id: string): Promise<Farm> {
    return prisma.farm.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const farmRepository = new FarmRepository();
