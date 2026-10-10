import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  (prisma as any).$on?.('query', (e: any) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'Prisma query');
  });
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Connected to PostgreSQL via Prisma');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Disconnected from PostgreSQL');
}
