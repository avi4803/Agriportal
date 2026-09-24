import { Request, Response } from 'express';
import { telemetryService } from '../services/telemetry.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const ingest = catchAsync(async (req: Request, res: Response) => {
  const { recordedAt, payload } = req.body;
  const device = req.device!;

  const result = await telemetryService.ingest(device.id, device.farmId, recordedAt, payload);
  // HTTP 202 Accepted: packet buffered for asynchronous batching
  res.status(202).json({
    status: 'accepted',
    data: result,
  });
});

export const getTelemetry = catchAsync(async (req: Request, res: Response) => {
  const result = await telemetryService.getTelemetry({
    deviceId: req.query.deviceId as string,
    farmId: req.query.farmId as string,
    from: req.query.from as string,
    to: req.query.to as string,
    cursor: req.query.cursor as string,
    take: req.query.take ? parseInt(req.query.take as string, 10) : undefined,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});
