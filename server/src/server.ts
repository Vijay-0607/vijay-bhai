import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

async function bootstrap() {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 MandiMatch API server running on http://localhost:${env.PORT}`);
    logger.info(`📚 Swagger OpenAPI documentation available at http://localhost:${env.PORT}/docs`);
    logger.info(`🩺 Health check available at http://localhost:${env.PORT}/health`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Prisma disconnected.');
      process.exit(0);
    });

    // Force shutdown after 10s timeout
    setTimeout(() => {
      logger.error('Forcefully terminating process after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
