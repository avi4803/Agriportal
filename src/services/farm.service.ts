import { farmRepository } from '../repositories/farm.repository.js';
import { AppError } from '../errors/AppError.js';

export class FarmService {
  async createFarm(name: string, userId: string) {
    return farmRepository.createWithInitialOwner(name, userId);
  }

  async getUserFarms(userId: string) {
    return farmRepository.findFarmsByUserId(userId);
  }

  async getFarmById(farmId: string) {
    const farm = await farmRepository.findById(farmId);
    if (!farm) {
      throw AppError.notFound('Farm not found');
    }
    return farm;
  }

  async createParcel(farmId: string, name: string, cropType?: string, plantedAt?: string) {
    return farmRepository.createParcel(farmId, {
      name,
      cropType,
      plantedAt: plantedAt ? new Date(plantedAt) : undefined,
    });
  }
}

export const farmService = new FarmService();
