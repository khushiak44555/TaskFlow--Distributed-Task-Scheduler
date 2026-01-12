import { Router } from 'express';
import Joi from 'joi';
import { prisma } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { AppError } from '../middleware/error-handler';
import { queueService } from '../services/queue.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTaskSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('ONE_TIME', 'RECURRING', 'DELAYED').required(),
  cronExpression: Joi.string().when('type', {
    is: 'RECURRING',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  scheduledAt: Joi.date().when('type', {
    is: Joi.valid('ONE_TIME', 'DELAYED'),
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
  priority: Joi.number().integer().min(0).max(10).default(0),
  payload: Joi.object().optional(),
  maxRetries: Joi.number().integer().min(0).max(10).default(3),
  timeout: Joi.number().integer().min(1000).default(30000),
  rateLimit: Joi.number().integer().min(1).optional()
});

const updateTaskSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid('ACTIVE', 'PAUSED').optional(),
  cronExpression: Joi.string().optional(),
  scheduledAt: Joi.date().optional(),
  priority: Joi.number().integer().min(0).max(10).optional(),
  payload: Joi.object().optional(),
  maxRetries: Joi.number().integer().min(0).max(10).optional(),
  timeout: Joi.number().integer().min(1000).optional(),
  rateLimit: Joi.number().integer().min(1).optional()
});

// Create task
router.post('/', validate(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const taskData = req.body;

    // Create task in database
    const task = await prisma.task.create({
      data: {
        ...taskData,
        createdBy: userId
      }
    });

    // Schedule job based on task type
    if (task.type === 'RECURRING' && task.cronExpression) {
      await queueService.addRecurringJob(
        task.id,
        task.cronExpression,
        task.payload,
        {
          priority: task.priority,
          timeout: task.timeout
        }
      );
    } else if (task.type === 'DELAYED' && task.scheduledAt) {
      const delay = new Date(task.scheduledAt).getTime() - Date.now();
      await queueService.addJob(task.id, task.payload, {
        delay: Math.max(0, delay),
        priority: task.priority,
        timeout: task.timeout
      });
    } else if (task.type === 'ONE_TIME') {
      await queueService.addJob(task.id, task.payload, {
        priority: task.priority,
        timeout: task.timeout
      });
    }

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
});

// Get all tasks
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { status, type, page = 1, limit = 20 } = req.query;

    const where: any = {
      createdBy: userId,
      deletedAt: null
    };

    if (status) where.status = status;
    if (type) where.type = type;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            executions: true,
            deadLetters: true
          }
        }
      }
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Update task
router.patch('/:id', validate(updateTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null
      }
    });

    if (!existingTask) {
      throw new AppError(404, 'Task not found');
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updates
    });

    // Handle queue updates if needed
    if (updates.status === 'PAUSED') {
      // Logic to pause job would go here
    } else if (updates.status === 'ACTIVE') {
      // Logic to resume job would go here
    }

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
});

// Delete task (soft delete)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null
      }
    });

    if (!existingTask) {
      throw new AppError(404, 'Task not found');
    }

    // Soft delete
    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'COMPLETED'
      }
    });

    // Remove from queue if recurring
    if (existingTask.type === 'RECURRING') {
      const jobId = `recurring-${id}`;
      await queueService.removeJob(jobId);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get task statistics
router.get('/:id/stats', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const task = await prisma.task.findFirst({
      where: {
        id,
        createdBy: userId,
        deletedAt: null
      }
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    // Get execution statistics
    const stats = await prisma.jobExecution.groupBy({
      by: ['status'],
      where: { taskId: id },
      _count: true,
      _avg: { duration: true }
    });

    const totalExecutions = await prisma.jobExecution.count({
      where: { taskId: id }
    });

    const deadLetterCount = await prisma.deadLetterJob.count({
      where: { taskId: id }
    });

    res.json({
      stats: {
        total: totalExecutions,
        byStatus: stats,
        deadLetters: deadLetterCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
