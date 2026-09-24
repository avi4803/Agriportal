import { Request, Response } from 'express';
import { deviceService } from '../services/device.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createDevice = catchAsync(async (req: Request, res: Response) => {
  const { name, parcelId, latitude, longitude } = req.body;
  const result = await deviceService.createDevice(req.params.farmId, name, parcelId, latitude, longitude);
  res.status(201).json({ status: 'success', data: result });
});

export const listDevices = catchAsync(async (req: Request, res: Response) => {
  const devices = await deviceService.listFarmDevices(req.params.farmId);
  res.status(200).json({ status: 'success', data: devices });
});

export const updateDevice = catchAsync(async (req: Request, res: Response) => {
  const updated = await deviceService.updateDevice(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: updated });
});

export const rotateToken = catchAsync(async (req: Request, res: Response) => {
  const result = await deviceService.rotateToken(req.params.id);
  res.status(200).json({ status: 'success', data: result });
});

export const getCapabilities = catchAsync(async (req: Request, res: Response) => {
  const result = await deviceService.getCapabilities(req.params.id);
  res.status(200).json({ status: 'success', data: result });
});
