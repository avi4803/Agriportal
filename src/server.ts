import http from 'http';
import cron from 'node-cron';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initSocketGateway } from './sockets/socket-gateway.js';
import { deviceRepository } from './repositories/device.repository.js';
import { rollupService } from './services/rollup.service.js';
import { ingestionBufferService } from './services/ingestion-buffer.service.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io real-time push gateway
initSocketGateway(server);

// 1. Cron Job: Device offline detector (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  try {
    const staleThreshold = new Date(Date.now() - env.OFFLINE_THRESHOLD_MINUTES * 60 * 1000);
    const markedCount = await deviceRepository.markStaleDevicesOffline(staleThreshold);
    if (markedCount > 0) {
      logger.info({ markedCount }, 'Marked stale devices as OFFLINE');
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error in offline device cron job');
  }
});

// 2. Cron Job: Nightly downsampling rollup (runs every night at 02:00 AM)
cron.schedule('0 2 * * *', async () => {
  await rollupService.runNightlyRollup();
});

// Start listening
server.listen(env.PORT, () => {
  logger.info(`AgriPortal Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`API documentation available at http://localhost:${env.PORT}/api/v1/docs`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Draining ingestion buffer and closing connections...`);
  try {
    await ingestionBufferService.flush();
    server.close(() => {
      logger.info('HTTP server closed successfully');
      process.exit(0);
    });
  } catch (err: any) {
    logger.error({ err: err.message }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
