import { Router } from 'express';
import { prisma } from '../utils/db';
import { queueService } from '../services/queue.service';
import IORedis from 'ioredis';
import { config } from '../config';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    const redis = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
    await redis.ping();
    await redis.quit();

    // Get queue metrics
    const queueMetrics = await queueService.getQueueMetrics();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        queue: queueMetrics
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

router.get('/live', (_req, res) => {
  res.json({ status: 'alive' });
});

export default router;
