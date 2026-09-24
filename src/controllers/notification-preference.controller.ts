import { Request, Response } from 'express';
import { notificationPreferenceRepository } from '../repositories/notification-preference.repository.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getMyPreference = catchAsync(async (req: Request, res: Response) => {
  const pref = await notificationPreferenceRepository.findByUserAndFarm(req.user!.id, req.params.farmId);
  res.status(200).json({
    status: 'success',
    data: pref || {
      userId: req.user!.id,
      farmId: req.params.farmId,
      minSeverity: 'WARNING',
      channels: ['IN_APP'],
    },
  });
});

export const updateMyPreference = catchAsync(async (req: Request, res: Response) => {
  const { minSeverity, channels } = req.body;
  const updated = await notificationPreferenceRepository.upsert({
    userId: req.user!.id,
    farmId: req.params.farmId,
    minSeverity,
    channels: channels || ['IN_APP'],
  });
  res.status(200).json({ status: 'success', data: updated });
});
