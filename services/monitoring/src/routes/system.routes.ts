import { Router } from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { prisma } from '../utils/db';

const router = Router();

// Redis connection status
router.get('/redis', async (_req, res) => {
  try {
    const redis = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });

    const info = await redis.info();
    await redis.quit();

    const lines = info.split('\r\n');
    const stats: Record<string, string> = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });

    res.json({
      status: 'connected',
      version: stats['redis_version'],
      uptime: stats['uptime_in_seconds'],
      connectedClients: stats['connected_clients'],
      usedMemory: stats['used_memory_human'],
      totalKeys: stats['db0']
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database status
router.get('/database', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    const [userCount, taskCount, executionCount] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.jobExecution.count()
    ]);

    res.json({
      status: 'connected',
      stats: {
        users: userCount,
        tasks: taskCount,
        executions: executionCount
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Queue status
router.get('/queue', async (_req, res) => {
  try {
    const connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null
    });

    const taskQueue = new Queue('taskflow:tasks', { connection });
    const deadLetterQueue = new Queue('taskflow:dead-letter', { connection });

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      deadLetter
    ] = await Promise.all([
      taskQueue.getWaitingCount(),
      taskQueue.getActiveCount(),
      taskQueue.getCompletedCount(),
      taskQueue.getFailedCount(),
      taskQueue.getDelayedCount(),
      deadLetterQueue.getWaitingCount()
    ]);

    await taskQueue.close();
    await deadLetterQueue.close();
    await connection.quit();

    res.json({
      taskQueue: {
        waiting,
        active,
        completed,
        failed,
        delayed
      },
      deadLetterQueue: {
        count: deadLetter
      },
      total: waiting + active + completed + failed + delayed
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System health check
router.get('/health', async (_req, res) => {
  try {
    // Check all services
    const [dbHealth, redisHealth] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ]);

    const isHealthy = dbHealth && redisHealth;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      services: {
        database: dbHealth ? 'up' : 'down',
        redis: redisHealth ? 'up' : 'down'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const redis = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password
    });
    await redis.ping();
    await redis.quit();
    return true;
  } catch {
    return false;
  }
}

export default router;
