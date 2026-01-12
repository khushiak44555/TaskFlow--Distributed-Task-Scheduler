import { Registry, Counter, Gauge, Histogram } from 'prom-client';

class MetricsService {
  public register: Registry;
  
  public jobsCompleted: Counter;
  public jobsFailed: Counter;
  public jobsProcessed: Counter;
  public jobDuration: Histogram;

  constructor() {
    this.register = new Registry();

    this.jobsCompleted = new Counter({
      name: 'taskflow_worker_jobs_completed_total',
      help: 'Total number of completed jobs',
      labelNames: ['task_type'],
      registers: [this.register]
    });

    this.jobsFailed = new Counter({
      name: 'taskflow_worker_jobs_failed_total',
      help: 'Total number of failed jobs',
      labelNames: ['task_type', 'error_type'],
      registers: [this.register]
    });

    this.jobsProcessed = new Counter({
      name: 'taskflow_worker_jobs_processed_total',
      help: 'Total number of processed jobs',
      labelNames: ['status', 'task_type'],
      registers: [this.register]
    });

    this.jobDuration = new Histogram({
      name: 'taskflow_worker_job_duration_seconds',
      help: 'Job processing duration in seconds',
      labelNames: ['task_type', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register]
    });
  }

  recordJobCompleted(taskType: string) {
    this.jobsCompleted.inc({ task_type: taskType });
    this.jobsProcessed.inc({ status: 'completed', task_type: taskType });
  }

  recordJobFailed(taskType: string, errorType: string) {
    this.jobsFailed.inc({ task_type: taskType, error_type: errorType });
    this.jobsProcessed.inc({ status: 'failed', task_type: taskType });
  }

  recordJobProcessed(status: string, taskType: string) {
    this.jobsProcessed.inc({ status, task_type: taskType });
  }

  recordJobDuration(taskType: string, status: string, durationSeconds: number) {
    this.jobDuration.observe({ task_type: taskType, status }, durationSeconds);
  }
}

export const metricsService = new MetricsService();
