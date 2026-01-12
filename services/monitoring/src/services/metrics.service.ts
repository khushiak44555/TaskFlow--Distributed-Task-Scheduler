import { Registry, Gauge } from 'prom-client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

class MetricsService {
  public register: Registry;
  private collectionInterval: NodeJS.Timeout | null = null;
  
  private queueWaiting: Gauge;
  private queueActive: Gauge;
  private queueCompleted: Gauge;
  private queueFailed: Gauge;
  private queueDelayed: Gauge;
  private totalTasks: Gauge;
  private activeTasks: Gauge;
  private totalUsers: Gauge;

  constructor() {
    this.register = new Registry();

    // Queue metrics
    this.queueWaiting = new Gauge({
      name: 'taskflow_queue_waiting',
      help: 'Number of jobs waiting in queue',
      registers: [this.register]
    });

    this.queueActive = new Gauge({
      name: 'taskflow_queue_active',
      help: 'Number of active jobs',
      registers: [this.register]
    });

    this.queueCompleted = new Gauge({
      name: 'taskflow_queue_completed',
      help: 'Number of completed jobs',
      registers: [this.register]
    });

    this.queueFailed = new Gauge({
      name: 'taskflow_queue_failed',
      help: 'Number of failed jobs',
      registers: [this.register]
    });

    this.queueDelayed = new Gauge({
      name: 'taskflow_queue_delayed',
      help: 'Number of delayed jobs',
      registers: [this.register]
    });

    // Task metrics
    this.totalTasks = new Gauge({
      name: 'taskflow_tasks_total',
      help: 'Total number of tasks',
      registers: [this.register]
    });

    this.activeTasks = new Gauge({
      name: 'taskflow_tasks_active',
      help: 'Number of active tasks',
      registers: [this.register]
    });

    // User metrics
    this.totalUsers = new Gauge({
      name: 'taskflow_users_total',
      help: 'Total number of users',
      registers: [this.register]
    });
  }

  async collectMetrics() {
    try {
      // Collect queue metrics
      const connection = new IORedis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null
      });

      const taskQueue = new Queue('taskflow-tasks', { connection });

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        taskQueue.getWaitingCount(),
        taskQueue.getActiveCount(),
        taskQueue.getCompletedCount(),
        taskQueue.getFailedCount(),
        taskQueue.getDelayedCount()
      ]);

      this.queueWaiting.set(waiting);
      this.queueActive.set(active);
      this.queueCompleted.set(completed);
      this.queueFailed.set(failed);
      this.queueDelayed.set(delayed);

      await taskQueue.close();
      await connection.quit();

      // Collect database metrics
      const [totalTasks, activeTasks, totalUsers] = await Promise.all([
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        prisma.user.count({ where: { isActive: true } })
      ]);

      this.totalTasks.set(totalTasks);
      this.activeTasks.set(activeTasks);
      this.totalUsers.set(totalUsers);

      logger.debug('Metrics collected successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to collect metrics');
    }
  }

  startCollection(intervalMs: number = 15000) {
    logger.info(`Starting metrics collection every ${intervalMs}ms`);
    
    // Collect immediately
    this.collectMetrics();

    // Then collect periodically
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      logger.info('Metrics collection stopped');
    }
  }
}

export const metricsService = new MetricsService();
