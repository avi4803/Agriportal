import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import { farmMemberRepository } from '../repositories/farm-member.repository.js';

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const requireFarmRole = (minRole: Role) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('User must be authenticated');
      }

      const farmId = req.params.farmId || (req.query.farmId as string) || req.body?.farmId;
      if (!farmId) {
        throw AppError.badRequest('farmId is required to verify permissions');
      }

      const membership = await farmMemberRepository.findMembership(farmId, req.user.id);
      if (!membership) {
        throw AppError.forbidden('You are not a member of this farm');
      }

      if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        throw AppError.forbidden(`Requires at least ${minRole} role`);
      }

      req.farmRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};
