import { Router } from 'express';
import { prisma } from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error-handler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get job executions
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { taskId, status, page = 1, limit = 20 } = req.query;

    const where: any = {
      task: {
        createdBy: userId,
        deletedAt: null
      }
    };

    if (taskId) where.taskId = taskId;
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      prisma.jobExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          task: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          retries: true
        }
      }),
      prisma.jobExecution.count({ where })
    ]);

    res.json({
      executions,
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

// Get execution by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const execution = await prisma.jobExecution.findFirst({
      where: {
        id,
        task: {
          createdBy: userId,
          deletedAt: null
        }
      },
      include: {
        task: true,
        retries: {
          orderBy: { retriedAt: 'desc' }
        }
      }
    });

    if (!execution) {
      throw new AppError(404, 'Job execution not found');
    }

    res.json({ execution });
  } catch (error) {
    next(error);
  }
});

// Get dead letter jobs
router.get('/dead-letter/list', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const where = {
      task: {
        createdBy: userId,
        deletedAt: null
      }
    };

    const [deadLetters, total] = await Promise.all([
      prisma.deadLetterJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          task: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }),
      prisma.deadLetterJob.count({ where })
    ]);

    res.json({
      deadLetters,
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

export default router;
