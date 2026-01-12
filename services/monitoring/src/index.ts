import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { metricsService } from './services/metrics.service';
import statsRoutes from './routes/stats.routes';
import systemRoutes from './routes/system.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Prometheus metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', metricsService.register.contentType);
  res.end(await metricsService.register.metrics());
});

// API routes
app.use('/api/stats', statsRoutes);
app.use('/api/system', systemRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'monitoring',
    timestamp: new Date().toISOString() 
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`📊 Monitoring Service running on port ${PORT}`);
  
  // Start metrics collection
  metricsService.startCollection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  metricsService.stopCollection();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down...');
  metricsService.stopCollection();
  process.exit(0);
});

export default app;
