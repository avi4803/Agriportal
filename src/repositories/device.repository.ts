import { prisma } from '../config/prisma.js';
import { Device, Prisma } from '@prisma/client';

export class DeviceRepository {
  async findById(id: string): Promise<Device | null> {
    return prisma.device.findFirst({
      where: { id, deletedAt: null },
      include: { parcel: true, farm: true },
    });
  }

  async findByHashedToken(hashedToken: string): Promise<Device | null> {
    return prisma.device.findUnique({
      where: { deviceToken: hashedToken },
      include: { farm: true },
    });
  }

  async listByFarmId(farmId: string): Promise<Device[]> {
    return prisma.device.findMany({
      where: { farmId, deletedAt: null },
      include: { parcel: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    farmId: string;
    parcelId?: string;
    name: string;
    hashedToken: string;
    latitude?: number;
    longitude?: number;
  }): Promise<Device> {
    return prisma.device.create({
      data: {
        farmId: data.farmId,
        parcelId: data.parcelId,
        name: data.name,
        deviceToken: data.hashedToken,
        latitude: data.latitude,
        longitude: data.longitude,
        status: 'OFFLINE',
      },
    });
  }

  async update(id: string, data: Prisma.DeviceUpdateInput): Promise<Device> {
    return prisma.device.update({
      where: { id },
      data,
    });
  }

  async updateHeartbeat(id: string, timestamp: Date): Promise<void> {
    await prisma.device.update({
      where: { id },
      data: {
        lastSeenAt: timestamp,
        status: 'ONLINE',
      },
    });
  }

  async markStaleDevicesOffline(staleThreshold: Date): Promise<number> {
    const result = await prisma.device.updateMany({
      where: {
        status: 'ONLINE',
        lastSeenAt: { lt: staleThreshold },
      },
      data: { status: 'OFFLINE' },
    });
    return result.count;
  }
}

export const deviceRepository = new DeviceRepository();
