import { Request, Response } from 'express';
import { ruleRepository } from '../repositories/rule.repository.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createRule = catchAsync(async (req: Request, res: Response) => {
  const rule = await ruleRepository.create(req.params.farmId, req.body);
  res.status(201).json({ status: 'success', data: rule });
});

export const listRules = catchAsync(async (req: Request, res: Response) => {
  const rules = await ruleRepository.listByFarmId(req.params.farmId);
  res.status(200).json({ status: 'success', data: rules });
});

export const updateRule = catchAsync(async (req: Request, res: Response) => {
  const updated = await ruleRepository.update(req.params.id, req.body);
  res.status(200).json({ status: 'success', data: updated });
});
