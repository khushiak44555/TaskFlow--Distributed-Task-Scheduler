import { Registry, Counter, Gauge, Histogram } from 'prom-client';

class MetricsService {
  public register: Registry;
  
  // Counters
  public jobsProcessed: Counter;
  public jobsFailed: Counter;
  public jobsCompleted: Counter;
  
  // Gauges
  public queueSize: Gauge;
  public activeJobs: Gauge;
  
  // Histograms
  public jobDuration: Histogram;

  constructor() {
    this.register = new Registry();

    // Job counters
    this.jobsProcessed = new Counter({
      name: 'taskflow_jobs_processed_total',
      help: 'Total number of jobs processed',
      labelNames: ['status', 'task_type'],
      registers: [this.register]
    });

    this.jobsFailed = new Counter({
      name: 'taskflow_jobs_failed_total',
      help: 'Total number of failed jobs',
      labelNames: ['task_type', 'error_type'],
      registers: [this.register]
    });

    this.jobsCompleted = new Counter({
      name: 'taskflow_jobs_completed_total',
      help: 'Total number of completed jobs',
      labelNames: ['task_type'],
      registers: [this.register]
    });

    // Queue metrics
    this.queueSize = new Gauge({
      name: 'taskflow_queue_size',
      help: 'Current size of the job queue',
      labelNames: ['state'],
      registers: [this.register]
    });

    this.activeJobs = new Gauge({
      name: 'taskflow_active_jobs',
      help: 'Number of currently active jobs',
      registers: [this.register]
    });

    // Job duration
    this.jobDuration = new Histogram({
      name: 'taskflow_job_duration_seconds',
      help: 'Job processing duration in seconds',
      labelNames: ['task_type', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.register]
    });
  }

  recordJobProcessed(status: string, taskType: string) {
    this.jobsProcessed.inc({ status, task_type: taskType });
  }

  recordJobFailed(taskType: string, errorType: string) {
    this.jobsFailed.inc({ task_type: taskType, error_type: errorType });
  }

  recordJobCompleted(taskType: string) {
    this.jobsCompleted.inc({ task_type: taskType });
  }

  setQueueSize(state: string, size: number) {
    this.queueSize.set({ state }, size);
  }

  setActiveJobs(count: number) {
    this.activeJobs.set(count);
  }

  recordJobDuration(taskType: string, status: string, durationSeconds: number) {
    this.jobDuration.observe({ task_type: taskType, status }, durationSeconds);
  }
}

export const metricsService = new MetricsService();
