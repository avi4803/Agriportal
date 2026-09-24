import { Request, Response } from 'express';
import { farmService } from '../services/farm.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createFarm = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await farmService.createFarm(name, req.user!.id);
  res.status(201).json({ status: 'success', data: result });
});

export const listFarms = catchAsync(async (req: Request, res: Response) => {
  const farms = await farmService.getUserFarms(req.user!.id);
  res.status(200).json({ status: 'success', data: farms });
});

export const getFarm = catchAsync(async (req: Request, res: Response) => {
  const farm = await farmService.getFarmById(req.params.farmId);
  res.status(200).json({ status: 'success', data: farm });
});

export const createParcel = catchAsync(async (req: Request, res: Response) => {
  const { name, cropType, plantedAt } = req.body;
  const parcel = await farmService.createParcel(req.params.farmId, name, cropType, plantedAt);
  res.status(201).json({ status: 'success', data: parcel });
});
