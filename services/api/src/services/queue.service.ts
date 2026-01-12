import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

class QueueService {
  private connection: IORedis;
  public taskQueue: Queue;
  public deadLetterQueue: Queue;

  constructor() {
    this.connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null
    });

    this.connection.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    this.connection.on('error', (error) => {
      logger.error({ error }, '❌ Redis connection error');
    });

    // Main task queue
    this.taskQueue = new Queue('taskflow-tasks', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600 // 24 hours
        },
        removeOnFail: {
          age: 7 * 24 * 3600 // 7 days
        }
      }
    });

    // Dead letter queue for failed jobs
    this.deadLetterQueue = new Queue('taskflow-dead-letter', {
      connection: this.connection
    });

    logger.info('Queue service initialized');
  }

  async addJob(taskId: string, payload: any, options?: any) {
    try {
      const job = await this.taskQueue.add(
        `task-${taskId}`,
        { taskId, payload },
        {
          ...options,
          jobId: `${taskId}-${Date.now()}`
        }
      );

      logger.info({ jobId: job.id, taskId }, 'Job added to queue');
      return job;
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to add job to queue');
      throw error;
    }
  }

  async addRecurringJob(taskId: string, cronExpression: string, payload: any, options?: any) {
    try {
      const job = await this.taskQueue.add(
        `task-${taskId}`,
        { taskId, payload },
        {
          ...options,
          repeat: {
            pattern: cronExpression
          },
          jobId: `recurring-${taskId}`
        }
      );

      logger.info({ jobId: job.id, taskId, cron: cronExpression }, 'Recurring job scheduled');
      return job;
    } catch (error) {
      logger.error({ error, taskId }, 'Failed to schedule recurring job');
      throw error;
    }
  }

  async removeJob(jobId: string) {
    try {
      const job = await this.taskQueue.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info({ jobId }, 'Job removed from queue');
      }
    } catch (error) {
      logger.error({ error, jobId }, 'Failed to remove job');
      throw error;
    }
  }

  async pauseQueue() {
    await this.taskQueue.pause();
    logger.info('Queue paused');
  }

  async resumeQueue() {
    await this.taskQueue.resume();
    logger.info('Queue resumed');
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.taskQueue.getWaitingCount(),
      this.taskQueue.getActiveCount(),
      this.taskQueue.getCompletedCount(),
      this.taskQueue.getFailedCount(),
      this.taskQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  async close() {
    await this.taskQueue.close();
    await this.deadLetterQueue.close();
    await this.connection.quit();
    logger.info('Queue service closed');
  }
}

export const queueService = new QueueService();
