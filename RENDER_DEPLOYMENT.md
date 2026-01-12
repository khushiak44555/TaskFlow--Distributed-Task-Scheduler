# 🚀 Render Deployment Quick Guide

## Critical Setup Rule

**ALWAYS SET ROOT DIRECTORY** - This is the most important setting!

Never use `cd` commands in build/start commands. Instead, set the **Root Directory** field in Render dashboard.

---

## 1. Deploy API Service

### Settings:
- **Name**: `taskflow-api`
- **Environment**: `Node`
- **Root Directory**: `services/api` ⚠️ CRITICAL
- **Build Command**: `npm install && npx prisma generate`
- **Start Command**: `npx tsx src/index.ts`
- **Instance Type**: Free

### Environment Variables:
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
LOG_LEVEL=info
API_PORT=3001
API_HOST=0.0.0.0
```

---

## 2. Deploy Worker Service

### Settings:
- **Name**: `taskflow-worker`
- **Environment**: `Node`
- **Root Directory**: `services/worker` ⚠️ CRITICAL
- **Build Command**: `npm install`
- **Start Command**: `npx tsx src/index.ts`
- **Instance Type**: Free

### Environment Variables:
Same as API, plus:
```bash
WORKER_CONCURRENCY=5
```

---

## 3. Deploy Monitoring Service (Optional)

### Settings:
- **Name**: `taskflow-monitoring`
- **Environment**: `Node`
- **Root Directory**: `services/monitoring` ⚠️ CRITICAL
- **Build Command**: `npm install`
- **Start Command**: `npx tsx src/index.ts`
- **Instance Type**: Free

### Environment Variables:
Same as API, plus:
```bash
MONITORING_PORT=3002
```

---

## 4. Deploy Frontend

### Settings:
- **Name**: `taskflow-frontend`
- **Environment**: `Node`
- **Root Directory**: `frontend` ⚠️ CRITICAL
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: Free

### Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://taskflow-api.onrender.com
```

---

## 5. Run Database Migrations

After API service is deployed:

### Option A: From Render Shell
1. Go to API service in Render
2. Click "Shell" tab
3. Run:
```bash
npx prisma migrate deploy
```

### Option B: From Local Machine
```powershell
cd "C:\Users\Khushi\OneDrive\Documents\TaskFlow- Distributed Task Scheduler"
$env:DATABASE_URL="your-neon-connection-string"
npx prisma migrate deploy --schema=services/api/prisma/schema.prisma
```

---

## Common Errors & Solutions

### ❌ "Cannot find module 'autoprefixer'"
**Cause:** Root Directory not set correctly  
**Fix:** Set Root Directory to `frontend` (not empty!)

### ❌ "Module not found: Can't resolve '@/lib/api'"
**Cause:** Building from wrong directory  
**Fix:** Verify Root Directory is set to `frontend`

### ❌ TypeScript compilation errors
**Cause:** Old code version  
**Fix:** Make sure you pushed latest changes to GitHub

### ❌ "Build failed because of workspace"
**Cause:** Render trying to build all workspaces  
**Fix:** Set Root Directory to specific service folder

---

## Deployment Checklist

Before deploying, verify:

- [x] All code pushed to GitHub
- [x] Neon database connection string ready
- [x] Upstash Redis credentials ready
- [x] JWT_SECRET generated (use a strong random string)

For each service:
- [x] Root Directory set to correct folder
- [x] Build command has NO `cd` commands
- [x] Start command has NO `cd` commands
- [x] All environment variables added
- [x] Instance Type set to Free

After deployment:
- [x] Run database migrations
- [x] Check service logs for errors
- [x] Test API endpoint (visit https://your-api.onrender.com/health)
- [x] Test frontend (visit your frontend URL)
- [x] Try to register/login

---

## Service URLs

After deployment, your services will be at:
- **API**: `https://taskflow-api.onrender.com`
- **Worker**: (no public URL, runs in background)
- **Monitoring**: `https://taskflow-monitoring.onrender.com`
- **Frontend**: `https://taskflow-frontend.onrender.com`

---

## Important Notes

1. **Free tier limitations:**
   - Services spin down after 15 min of inactivity
   - First request after spin-down takes ~30 seconds
   - 750 hours/month free (good for 1-2 services)

2. **Keep services alive:**
   - Use UptimeRobot or similar to ping your services
   - Or upgrade to paid tier ($7/month per service)

3. **Database connections:**
   - Neon free tier: 100 hours compute/month
   - Close database connections properly
   - Use connection pooling

4. **Environment variables:**
   - Never commit secrets to GitHub
   - Use Render's environment variable feature
   - Same variables for all backend services

---

## Support

If deployment fails:
1. Check Render logs (click on failed deploy)
2. Verify Root Directory is set correctly
3. Verify all environment variables are present
4. Check GitHub Actions for any errors
5. Review [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) for detailed troubleshooting

---

**Last Updated**: After fixing all TypeScript errors (Commit 2119c3c)
