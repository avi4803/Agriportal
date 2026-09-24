import { telemetryRepository } from '../repositories/telemetry.repository.js';
import { deviceRepository } from '../repositories/device.repository.js';
import { predictionRepository } from '../repositories/prediction.repository.js';
import { predictorEngine } from './agronomy/predictor-engine.js';
import { ruleEngineService } from './rule-engine.service.js';
import { emitTelemetry, emitPrediction } from '../sockets/socket-gateway.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export interface BufferedTelemetryItem {
  deviceId: string;
  farmId: string;
  recordedAt: Date;
  payload: Record<string, any>;
}

/**
 * ARCHITECTURAL NOTE:
 * The IngestionBufferService buffers incoming telemetry in-memory to prevent single-row DB inserts under heavy load.
 *
 * Explicit trade-offs:
 * 1. The in-memory buffer is not durable across an ungraceful process crash/restart.
 * 2. This backend is designed to run as a single instance; horizontal scaling requires revisiting the buffer and socket adapter.
 */
export class IngestionBufferService {
  private buffer: BufferedTelemetryItem[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor() {
    this.startPeriodicFlush();
  }

  push(item: BufferedTelemetryItem) {
    this.buffer.push(item);
    if (this.buffer.length >= env.INGESTION_BUFFER_BATCH_SIZE) {
      this.flush();
    }
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0 && !this.isFlushing) {
        this.flush();
      }
    }, env.INGESTION_BUFFER_FLUSH_MS);
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;
    this.isFlushing = true;

    // Drain current buffer
    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await this.insertBatchWithRetry(batch);
      await this.postBatchProcessing(batch);
    } catch (err: any) {
      logger.error({ err: err.message, batchCount: batch.length }, 'Failed to persist telemetry batch after retries');
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Retries on transient connection dropouts (ECONNRESET, connection timeout) with exponential backoff:
   * 200ms -> 800ms -> 3200ms.
   * Does NOT retry on validation or constraint errors.
   */
  private async insertBatchWithRetry(batch: BufferedTelemetryItem[], maxRetries = 3): Promise<void> {
    let attempt = 0;
    const delays = [200, 800, 3200];

    const records = batch.map((item) => ({
      deviceId: item.deviceId,
      recordedAt: item.recordedAt,
      payload: item.payload,
    }));

    while (attempt < maxRetries) {
      try {
        await telemetryRepository.createMany(records);
        return;
      } catch (err: any) {
        attempt++;
        const isTransient =
          err.code === 'P1001' || // Can't reach database server
          err.code === 'P1002' || // Database server was reached but timed out
          err.message?.includes('ECONNRESET') ||
          err.message?.includes('Connection pool timeout');

        if (!isTransient || attempt >= maxRetries) {
          throw err;
        }

        const delay = delays[attempt - 1] || 1000;
        logger.warn({ attempt, delay, err: err.message }, 'Transient DB error on batch insert; retrying...');
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Synchronous post-ingestion processing:
   * 1. Agronomic predictor formulas
   * 2. Synchronous rule engine evaluation
   * 3. Device online/heartbeat update
   * 4. Real-time Socket.io farm room broadcast
   */
  private async postBatchProcessing(batch: BufferedTelemetryItem[]): Promise<void> {
    for (const item of batch) {
      try {
        // 1. Evaluate agronomic predictions
        const predictions = predictorEngine.evaluate(item.payload);
        
        // 2. Fetch the newly inserted telemetry record to link predictions
        const recentTelemetry = await telemetryRepository.findRecent(item.deviceId, 1);
        if (recentTelemetry.length > 0 && predictions.length > 0) {
          const telemetryId = recentTelemetry[0].id;
          await predictionRepository.createMany(
            predictions.map((p) => ({
              telemetryId,
              type: p.type,
              value: p.value,
              meta: p.meta,
            }))
          );
        }

        // 3. Update device status and heartbeat
        await deviceRepository.updateHeartbeat(item.deviceId, item.recordedAt);

        // 4. Synchronous rule engine evaluation
        await ruleEngineService.evaluate(item.farmId, item.deviceId, item.payload, predictions);

        // 5. Broadcast real-time updates via Socket.io
        emitTelemetry(item.farmId, item.deviceId, item.payload, item.recordedAt);
        if (predictions.length > 0) {
          emitPrediction(item.farmId, item.deviceId, predictions);
        }
      } catch (err: any) {
        logger.error({ err: err.message, deviceId: item.deviceId }, 'Error in post-batch processing');
      }
    }
  }
}

export const ingestionBufferService = new IngestionBufferService();
