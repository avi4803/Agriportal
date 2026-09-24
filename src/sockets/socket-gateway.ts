import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { farmMemberRepository } from '../repositories/farm-member.repository.js';
import { prisma } from '../config/prisma.js';

let ioInstance: Server | null = null;

export function initSocketGateway(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Handshake authentication with operator JWT
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
      socket.data.userId = decoded.userId;

      // Find all farms user belongs to and join room: farm:<farmId>
      const memberships = await prisma.farmMember.findMany({
        where: { userId: decoded.userId },
        select: { farmId: true },
      });

      memberships.forEach((m) => {
        socket.join(`farm:${m.farmId}`);
        logger.debug({ userId: decoded.userId, farmId: m.farmId }, 'Socket joined farm room');
      });

      next();
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Socket.io handshake authentication rejected');
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id, userId: socket.data.userId }, 'Socket connected');

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketIO(): Server | null {
  return ioInstance;
}

// Push-based telemetry streaming helpers
export function emitTelemetry(farmId: string, deviceId: string, payload: Record<string, any>, recordedAt: Date) {
  if (!ioInstance) return;
  ioInstance.to(`farm:${farmId}`).emit('telemetry:new', {
    deviceId,
    farmId,
    payload,
    recordedAt: recordedAt.toISOString(),
  });
}

export function emitPrediction(farmId: string, deviceId: string, predictions: any[]) {
  if (!ioInstance) return;
  ioInstance.to(`farm:${farmId}`).emit('prediction:new', {
    deviceId,
    farmId,
    predictions,
  });
}

export function emitAlert(farmId: string, alert: any) {
  if (!ioInstance) return;
  ioInstance.to(`farm:${farmId}`).emit('alert:new', {
    farmId,
    alert,
  });
}
