import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const result = await authService.register(name, email, password);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshToken(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: result.accessToken,
    },
  });
});
