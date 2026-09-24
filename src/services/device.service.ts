import crypto from 'crypto';
import { deviceRepository } from '../repositories/device.repository.js';
import { telemetryRepository } from '../repositories/telemetry.repository.js';
import { predictorEngine } from './agronomy/predictor-engine.js';
import { AppError } from '../errors/AppError.js';

export class DeviceService {
  async createDevice(farmId: string, name: string, parcelId?: string, lat?: number, lng?: number) {
    // Generate secure 32-byte raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const device = await deviceRepository.create({
      farmId,
      parcelId,
      name,
      hashedToken,
      latitude: lat,
      longitude: lng,
    });

    // Return the raw token EXACTLY ONCE to the provisioner
    return {
      device,
      rawDeviceToken: rawToken,
    };
  }

  async listFarmDevices(farmId: string) {
    return deviceRepository.listByFarmId(farmId);
  }

  async updateDevice(id: string, updates: any) {
    return deviceRepository.update(id, updates);
  }

  async rotateToken(id: string) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await deviceRepository.update(id, { deviceToken: hashedToken });
    return { rawDeviceToken: rawToken };
  }

  /**
   * Device capabilities check: powers the "Connect Sensor to Unlock" badges.
   */
  async getCapabilities(id: string) {
    const device = await deviceRepository.findById(id);
    if (!device) {
      throw AppError.notFound('Device not found');
    }

    // Inspect recent 3 packets
    const recent = await telemetryRepository.findRecent(id, 3);
    const payloads = recent.map((t) => t.payload as Record<string, any>);

    const capabilities = predictorEngine.getDeviceCapabilities(payloads);
    return {
      deviceId: id,
      deviceName: device.name,
      capabilities,
    };
  }
}

export const deviceService = new DeviceService();
