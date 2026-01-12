import { Router } from 'express';
import { prisma } from '../utils/db';

const router = Router();

// Overall statistics
router.get('/overview', async (_req, res) => {
  try {
    const [
      totalTasks,
      activeTasks,
      totalExecutions,
      recentExecutions,
      deadLetterJobs
    ] = await Promise.all([
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.jobExecution.count(),
      prisma.jobExecution.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.deadLetterJob.count()
    ]);

    const executionStats = await prisma.jobExecution.groupBy({
      by: ['status'],
      _count: true
    });

    const successRate = await calculateSuccessRate();

    res.json({
      tasks: {
        total: totalTasks,
        active: activeTasks,
        paused: totalTasks - activeTasks
      },
      executions: {
        total: totalExecutions,
        last24Hours: recentExecutions,
        byStatus: executionStats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.status.toLowerCase()] = stat._count;
          return acc;
        }, {} as Record<string, number>)
      },
      deadLetterJobs,
      successRate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Job execution trends
router.get('/trends', async (_req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const executions = await prisma.jobExecution.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        status: true,
        createdAt: true,
        duration: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by hour/day depending on period
    const grouped = groupExecutionsByTime(executions, days);

    res.json({ trends: grouped });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Task type distribution
router.get('/task-distribution', async (_req, res) => {
  try {
    const distribution = await prisma.task.groupBy({
      by: ['type', 'status'],
      where: { deletedAt: null },
      _count: true
    });

    res.json({ distribution });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// Average execution time
router.get('/performance', async (_req, res) => {
  try {
    const avgDuration = await prisma.jobExecution.aggregate({
      where: {
        status: 'COMPLETED',
        duration: { not: null }
      },
      _avg: { duration: true },
      _min: { duration: true },
      _max: { duration: true }
    });

    const percentiles = await calculatePercentiles();

    res.json({
      averageDuration: avgDuration._avg.duration,
      minDuration: avgDuration._min.duration,
      maxDuration: avgDuration._max.duration,
      percentiles
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Recent failures
router.get('/recent-failures', async (_req, res) => {
  try {
    const failures = await prisma.jobExecution.findMany({
      where: {
        status: 'FAILED'
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    res.json({ failures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch failures' });
  }
});

// Helper functions
async function calculateSuccessRate(): Promise<number> {
  const [completed, failed] = await Promise.all([
    prisma.jobExecution.count({ where: { status: 'COMPLETED' } }),
    prisma.jobExecution.count({ where: { status: 'FAILED' } })
  ]);

  const total = completed + failed;
  return total > 0 ? (completed / total) * 100 : 0;
}

function groupExecutionsByTime(executions: any[], days: number) {
  const bucketSize = days === 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour or 1 day
  const buckets: Record<string, { completed: number; failed: number; total: number }> = {};

  executions.forEach(exec => {
    const timestamp = Math.floor(new Date(exec.createdAt).getTime() / bucketSize) * bucketSize;
    const key = new Date(timestamp).toISOString();

    if (!buckets[key]) {
      buckets[key] = { completed: 0, failed: 0, total: 0 };
    }

    buckets[key].total++;
    if (exec.status === 'COMPLETED') buckets[key].completed++;
    if (exec.status === 'FAILED') buckets[key].failed++;
  });

  return Object.entries(buckets).map(([time, counts]) => ({
    time,
    ...counts
  }));
}

async function calculatePercentiles() {
  const durations = await prisma.jobExecution.findMany({
    where: {
      status: 'COMPLETED',
      duration: { not: null }
    },
    select: { duration: true },
    orderBy: { duration: 'asc' }
  });

  const sorted = durations.map((d: any) => d.duration!).sort((a: number, b: number) => a - b);
  
  return {
    p50: getPercentile(sorted, 50),
    p95: getPercentile(sorted, 95),
    p99: getPercentile(sorted, 99)
  };
}

function getPercentile(sorted: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

export default router;
