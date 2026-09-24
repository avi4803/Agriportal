import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow server-to-server or curl requests with no origin
    if (!origin) return callback(null, true);
    if (env.corsOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-token'],
});
