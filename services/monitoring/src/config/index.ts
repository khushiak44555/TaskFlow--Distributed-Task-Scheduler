import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.MONITORING_PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || ''
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  },
  
  logLevel: process.env.LOG_LEVEL || 'info'
};
