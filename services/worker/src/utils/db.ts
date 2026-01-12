import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

prisma.$on('error' as never, (e: any) => {
  logger.error(e, 'Database error');
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn(e, 'Database warning');
});

export { prisma };
