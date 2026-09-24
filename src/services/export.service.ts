import { Response } from 'express';
import { stringify } from 'csv-stringify';
import { telemetryRepository } from '../repositories/telemetry.repository.js';
import { AppError } from '../errors/AppError.js';

export class ExportService {
  async streamExport(
    farmId: string,
    from: string,
    to: string,
    format: 'csv' | 'parquet',
    res: Response
  ): Promise<void> {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Apply safe 1-year hard cap
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > oneYearMs) {
      throw AppError.badRequest('Export range cannot exceed 1 year');
    }

    const filename = `agriportal_export_${farmId}_${fromDate.toISOString().slice(0, 10)}_${toDate.toISOString().slice(0, 10)}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const csvStream = stringify({
        header: true,
        columns: [
          'id',
          'deviceId',
          'deviceName',
          'recordedAt',
          'temp',
          'humidity',
          'topsoilMoisture',
          'deepSoilMoisture',
          'canopyTemp',
          'vpd',
          'cwsi',
          'rawPayload',
        ],
      });

      csvStream.pipe(res);

      let lastId: bigint | undefined = undefined;
      const batchSize = 500;

      while (true) {
        const batch = await telemetryRepository.findForExportBatch({
          farmId,
          from: fromDate,
          to: toDate,
          cursor: lastId,
          take: batchSize,
        });

        if (batch.length === 0) break;

        for (const row of batch) {
          const payload = (row.payload as Record<string, any>) || {};
          const vpdPred = row.predictions.find((p) => p.type === 'VPD');
          const cwsiPred = row.predictions.find((p) => p.type === 'CWSI');

          csvStream.write([
            row.id.toString(),
            row.deviceId,
            row.device?.name || '',
            row.recordedAt.toISOString(),
            payload.temp ?? '',
            payload.humidity ?? '',
            payload.topsoilMoisture ?? '',
            payload.deepSoilMoisture ?? '',
            payload.canopyTemp ?? '',
            vpdPred?.value ?? '',
            cwsiPred?.value ?? '',
            JSON.stringify(payload),
          ]);
        }

        lastId = batch[batch.length - 1].id;
        if (batch.length < batchSize) break;
      }

      csvStream.end();
    } else {
      // Parquet fallback streaming as JSON Lines if binary writer is not installed
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.jsonl"`);

      let lastId: bigint | undefined = undefined;
      const batchSize = 500;

      while (true) {
        const batch = await telemetryRepository.findForExportBatch({
          farmId,
          from: fromDate,
          to: toDate,
          cursor: lastId,
          take: batchSize,
        });

        if (batch.length === 0) break;

        for (const row of batch) {
          res.write(JSON.stringify(row) + '\n');
        }

        lastId = batch[batch.length - 1].id;
        if (batch.length < batchSize) break;
      }

      res.end();
    }
  }
}

export const exportService = new ExportService();
