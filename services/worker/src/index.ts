import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/db';
import { metricsService } from './services/metrics.service';
import { executeTask } from './processors/task.processor';

class WorkerService {
  private worker: Worker;
  private connection: IORedis;

  constructor() {
    this.connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null
    });

    this.connection.on('connect', () => {
      logger.info('✅ Worker connected to Redis');
    });

    this.connection.on('error', (error) => {
      logger.error({ error }, '❌ Worker Redis connection error');
    });

    this.worker = new Worker(
      'taskflow-tasks',
      async (job: Job) => {
        return await this.processJob(job);
      },
      {
        connection: this.connection,
        concurrency: config.worker.concurrency,
        limiter: {
          max: 100,
          duration: 1000
        },
        settings: {
          backoffStrategy: (attemptsMade: number) => {
            // Exponential backoff: 2^attempts * 1000ms
            return Math.pow(2, attemptsMade) * 1000;
          }
        }
      }
    );

    this.setupEventHandlers();
    logger.info(`🔨 Worker started with concurrency: ${config.worker.concurrency}`);
  }

  private async processJob(job: Job) {
    const { taskId, payload } = job.data;
    const startTime = Date.now();

    logger.info({ jobId: job.id, taskId, attempt: job.attemptsMade + 1 }, 'Processing job');

    try {
      // Get task details from database
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== 'ACTIVE') {
        logger.warn({ taskId }, 'Task is not active, skipping');
        return { status: 'skipped', reason: 'Task not active' };
      }

      // Create job execution record
      const execution = await prisma.jobExecution.create({
        data: {
          taskId: task.id,
          jobId: job.id!,
          status: 'PROCESSING',
          startedAt: new Date(),
          attempts: job.attemptsMade + 1
        }
      });

      // Execute the task
      const result = await executeTask(task, payload, job.opts.timeout || task.timeout);

      // Update execution with success
      const duration = Date.now() - startTime;
      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          duration,
          result
        }
      });

      // Update task last run time
      await prisma.task.update({
        where: { id: taskId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: task.type === 'RECURRING' ? this.calculateNextRun(task.cronExpression!) : null
        }
      });

      // Record metrics
      metricsService.recordJobCompleted(task.type);
      metricsService.recordJobDuration(task.type, 'completed', duration / 1000);

      logger.info({ jobId: job.id, taskId, duration }, 'Job completed successfully');

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      logger.error({ 
        jobId: job.id, 
        taskId, 
        error: error.message,
        attempt: job.attemptsMade + 1 
      }, 'Job failed');

      // Update execution with failure
      await prisma.jobExecution.updateMany({
        where: { jobId: job.id! },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          duration,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        }
      });

      // Record retry
      const execution = await prisma.jobExecution.findUnique({
        where: { jobId: job.id! }
      });

      if (execution) {
        await prisma.retryHistory.create({
          data: {
            executionId: execution.id,
            attemptNumber: job.attemptsMade + 1,
            error: {
              message: error.message,
              stack: error.stack
            }
          }
        });
      }

      // Record metrics
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) {
        metricsService.recordJobFailed(task.type, error.name || 'UnknownError');
        metricsService.recordJobDuration(task.type, 'failed', duration / 1000);
      }

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Job completed event');
      metricsService.recordJobProcessed('completed', 'unknown');
    });

    this.worker.on('failed', async (job, err) => {
      logger.error({ jobId: job?.id, error: err.message }, 'Job failed event');
      
      if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
        // Job exhausted all retries, move to dead letter queue
        logger.error({ jobId: job.id }, 'Job moved to dead letter queue');
        
        const { taskId, payload } = job.data;
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        
        if (task) {
          await prisma.deadLetterJob.create({
            data: {
              taskId: task.id,
              jobId: job.id!,
              payload,
              error: {
                message: err.message,
                stack: err.stack,
                name: err.name
              },
              attempts: job.attemptsMade
            }
          });

          metricsService.recordJobProcessed('dead_letter', task.type);
        }
      } else {
        metricsService.recordJobProcessed('retry', 'unknown');
      }
    });

    this.worker.on('active', (job) => {
      logger.debug({ jobId: job.id }, 'Job is now active');
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn({ jobId }, 'Job stalled');
    });

    this.worker.on('error', (error) => {
      logger.error({ error }, 'Worker error');
    });
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simplified cron calculation - in production use a proper cron parser
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  }

  async close() {
    await this.worker.close();
    await this.connection.quit();
    logger.info('Worker service closed');
  }
}

// Initialize worker
const workerService = new WorkerService();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  await workerService.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default workerService;
