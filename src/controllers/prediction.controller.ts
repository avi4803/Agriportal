import { Request, Response } from 'express';
import { predictionRepository } from '../repositories/prediction.repository.js';
import { paginateResults, decodeCursor } from '../utils/pagination.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getPredictions = catchAsync(async (req: Request, res: Response) => {
  const take = req.query.take ? parseInt(req.query.take as string, 10) : 50;
  const cursor = req.query.cursor ? decodeCursor(req.query.cursor as string) : undefined;
  const from = req.query.from ? new Date(req.query.from as string) : undefined;
  const to = req.query.to ? new Date(req.query.to as string) : undefined;

  const items = await predictionRepository.findPaginated({
    deviceId: req.query.deviceId as string,
    type: req.query.type as string,
    from,
    to,
    cursor,
    take,
  });

  const paginated = paginateResults(items, take);
  res.status(200).json({ status: 'success', data: paginated });
});
