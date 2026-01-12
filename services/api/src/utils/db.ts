import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Database query');
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error(e, 'Database error');
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn(e, 'Database warning');
});

export { prisma };
