import { farmMemberRepository } from '../repositories/farm-member.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../errors/AppError.js';
import { Role } from '@prisma/client';

export class FarmMemberService {
  async getMembers(farmId: string) {
    return farmMemberRepository.listMembers(farmId);
  }

  async inviteMember(farmId: string, email: string, role: Role) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound('User with that email does not exist. Please have them register first.');
    }

    const existing = await farmMemberRepository.findMembership(farmId, user.id);
    if (existing) {
      throw AppError.conflict('User is already a member of this farm');
    }

    return farmMemberRepository.addMember(farmId, user.id, role);
  }

  async updateMemberRole(farmId: string, targetUserId: string, role: Role, requestingUserId: string) {
    if (targetUserId === requestingUserId && role !== Role.OWNER) {
      throw AppError.badRequest('You cannot demote yourself from OWNER');
    }

    return farmMemberRepository.updateRole(farmId, targetUserId, role);
  }

  async removeMember(farmId: string, targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw AppError.badRequest('You cannot remove yourself from your own farm');
    }

    return farmMemberRepository.removeMember(farmId, targetUserId);
  }
}

export const farmMemberService = new FarmMemberService();
