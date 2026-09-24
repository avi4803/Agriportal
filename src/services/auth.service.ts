import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { userRepository } from '../repositories/user.repository.js';

export class AuthService {
  async register(name: string, email: string, password: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      name,
      email,
      passwordHash,
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw AppError.unauthorized('User not found');
      }

      const accessToken = this.generateAccessToken(user.id, user.email);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  private generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
  }
}

export const authService = new AuthService();
