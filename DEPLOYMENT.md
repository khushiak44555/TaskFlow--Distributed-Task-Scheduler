# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Neon account (neon.tech)
- Upstash account (upstash.com)
- Railway account (railway.app) OR Render account (render.com)

## Environment Variables Needed

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### Backend Services (.env)
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3001
API_HOST=0.0.0.0
WORKER_CONCURRENCY=5
MONITORING_PORT=3002
```

## Quick Start
Follow the steps in DEPLOYMENT.md for detailed instructions.
