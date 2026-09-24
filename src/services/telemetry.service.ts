import { ingestionBufferService } from './ingestion-buffer.service.js';
import { telemetryRepository } from '../repositories/telemetry.repository.js';
import { paginateResults, decodeCursor } from '../utils/pagination.js';

export class TelemetryService {
  async ingest(deviceId: string, farmId: string, recordedAt: string, payload: Record<string, any>) {
    const parsedDate = new Date(recordedAt);

    // Push into in-memory batch buffer for immediate 202 Accepted response
    ingestionBufferService.push({
      deviceId,
      farmId,
      recordedAt: parsedDate,
      payload,
    });

    return {
      status: 'buffered',
      deviceId,
      recordedAt: parsedDate.toISOString(),
    };
  }

  async getTelemetry(params: {
    deviceId?: string;
    farmId?: string;
    from?: string;
    to?: string;
    cursor?: string;
    take?: number;
  }) {
    const fromDate = params.from ? new Date(params.from) : undefined;
    const toDate = params.to ? new Date(params.to) : undefined;
    const decodedCursor = params.cursor ? decodeCursor(params.cursor) : undefined;

    const items = await telemetryRepository.findPaginated({
      deviceId: params.deviceId,
      farmId: params.farmId,
      from: fromDate,
      to: toDate,
      cursor: decodedCursor,
      take: params.take,
    });

    // Format BigInt IDs for JSON serialization
    const formatted = items.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return paginateResults(formatted as any, params.take || 50);
  }
}

export const telemetryService = new TelemetryService();
