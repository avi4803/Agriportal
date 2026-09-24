import { Request, Response } from 'express';
import { exportService } from '../services/export.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const exportTelemetry = catchAsync(async (req: Request, res: Response) => {
  const { farmId, from, to, format } = req.query as {
    farmId: string;
    from: string;
    to: string;
    format: 'csv' | 'parquet';
  };

  await exportService.streamExport(farmId, from, to, format || 'csv', res);
});
