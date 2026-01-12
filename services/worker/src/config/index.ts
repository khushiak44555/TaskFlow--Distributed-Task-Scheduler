import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || ''
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  },
  
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10)
  },
  
  logLevel: process.env.LOG_LEVEL || 'info'
};
