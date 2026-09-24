import { Request, Response } from 'express';
import { alertRepository } from '../repositories/alert.repository.js';
import { paginateResults, decodeCursor } from '../utils/pagination.js';
import { catchAsync } from '../utils/catchAsync.js';

export const listAlerts = catchAsync(async (req: Request, res: Response) => {
  const take = req.query.take ? parseInt(req.query.take as string, 10) : 50;
  const cursor = req.query.cursor ? decodeCursor(req.query.cursor as string) : undefined;
  const acknowledged = req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : undefined;

  const items = await alertRepository.listByFarmId({
    farmId: req.params.farmId,
    acknowledged,
    cursor,
    take,
  });

  const paginated = paginateResults(items, take);
  res.status(200).json({ status: 'success', data: paginated });
});

export const acknowledgeAlert = catchAsync(async (req: Request, res: Response) => {
  const alert = await alertRepository.acknowledge(req.params.id);
  res.status(200).json({ status: 'success', data: alert });
});
