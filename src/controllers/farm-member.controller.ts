import { Request, Response } from 'express';
import { farmMemberService } from '../services/farm-member.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const listMembers = catchAsync(async (req: Request, res: Response) => {
  const members = await farmMemberService.getMembers(req.params.farmId);
  res.status(200).json({ status: 'success', data: members });
});

export const inviteMember = catchAsync(async (req: Request, res: Response) => {
  const { email, role } = req.body;
  const member = await farmMemberService.inviteMember(req.params.farmId, email, role);
  res.status(201).json({ status: 'success', data: member });
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  const updated = await farmMemberService.updateMemberRole(
    req.params.farmId,
    req.params.userId,
    role,
    req.user!.id
  );
  res.status(200).json({ status: 'success', data: updated });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  await farmMemberService.removeMember(req.params.farmId, req.params.userId, req.user!.id);
  res.status(200).json({ status: 'success', message: 'Member access removed' });
});
