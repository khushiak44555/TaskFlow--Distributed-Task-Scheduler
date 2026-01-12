# 🚀 Complete Free Deployment Guide

## 📌 Table of Contents
1. [Setup Database (Neon)](#step-1-setup-database-neon)
2. [Setup Redis (Upstash)](#step-2-setup-redis-upstash)
3. [Push Code to GitHub](#step-3-push-to-github)
4. [Deploy Backend (Railway)](#step-4-deploy-backend-railway)
5. [Deploy Frontend (Vercel)](#step-5-deploy-frontend-vercel)
6. [Run Migrations](#step-6-run-migrations)
7. [Test Everything](#step-7-test-everything)

---

## STEP 1: Setup Database (Neon) ☁️

### 1.1 Create Neon Account
1. Go to https://neon.tech
2. Click "Sign Up" (use GitHub for easy auth)
3. Verify your email

### 1.2 Create Database
1. Click "Create Project"
2. Project name: `taskflow`
3. Region: Choose closest to you
4. PostgreSQL version: 15
5. Click "Create Project"

### 1.3 Get Connection String
1. On project dashboard, click "Connection Details"
2. Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. **SAVE THIS** - you'll need it later!

---

## STEP 2: Setup Redis (Upstash) 🔴

### 2.1 Create Upstash Account
1. Go to https://upstash.com
2. Click "Sign Up" (use GitHub)

### 2.2 Create Redis Database
1. Click "Create Database"
2. Name: `taskflow-redis`
3. Type: Regional
4. Region: Choose closest to you
5. Click "Create"

### 2.3 Get Redis Credentials
1. Click on your database
2. Copy these values:
   - **REDIS_HOST**: `xxx.upstash.io`
   - **REDIS_PORT**: `6379`
   - **REDIS_PASSWORD**: `your-password-here`
3. **SAVE THESE** - you'll need them!

---

## STEP 3: Push to GitHub 📦

### 3.1 Initialize Git (if not done)
```bash
cd "C:\Users\Khushi\OneDrive\Documents\TaskFlow- Distributed Task Scheduler"
git init
git add .
git commit -m "Initial commit - TaskFlow application"
```

### 3.2 Create GitHub Repository
1. Go to https://github.com
2. Click "+" → "New repository"
3. Name: `taskflow`
4. Keep it Public (for free deployments)
5. Click "Create repository"

### 3.3 Push Your Code
```bash
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

---

## STEP 4: Deploy Backend (Railway) 🚂

### Option A: Railway (Recommended)

#### 4.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway

#### 4.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `taskflow` repository
4. Railway will detect it's a Node.js project

#### 4.3 Deploy API Service
1. Click "New Service" → "GitHub Repo"
2. Select your repo
3. Click "Add Variables"
4. Add these environment variables:
   ```
   DATABASE_URL=<your-neon-connection-string>
   REDIS_HOST=<your-upstash-host>
   REDIS_PORT=6379
   REDIS_PASSWORD=<your-upstash-password>
   JWT_SECRET=super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   LOG_LEVEL=info
   API_PORT=3001
   API_HOST=0.0.0.0
   ```

#### 4.4 Configure Build Settings
1. Click "Settings" tab
2. Build Command: `npm install && cd services/api && npm install`
3. Start Command: `cd services/api && npx tsx src/index.ts`
4. Click "Deploy"

#### 4.5 Get API URL
1. After deployment, go to "Settings"
2. Click "Generate Domain"
3. Copy the URL (e.g., `https://taskflow-api.railway.app`)
4. **SAVE THIS** - you'll need it for frontend!

#### 4.6 Deploy Worker Service
1. Click "New Service" → Same repo
2. Add same environment variables PLUS:
   ```
   WORKER_CONCURRENCY=5
   ```
3. Build Command: `npm install && cd services/worker && npm install`
4. Start Command: `cd services/worker && npx tsx src/index.ts`
5. Deploy

#### 4.7 Deploy Monitoring Service (Optional)
1. Click "New Service" → Same repo
2. Add same environment variables PLUS:
   ```
   MONITORING_PORT=3002
   ```
3. Build Command: `npm install && cd services/monitoring && npm install`
4. Start Command: `cd services/monitoring && npx tsx src/index.ts`
5. Generate domain for monitoring
6. Deploy

---

### Option B: Render (Alternative)

#### 4B.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

#### 4B.2 Create Web Service for API
1. Click "New" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - Name: `taskflow-api`
   - Environment: `Node`
   - Build Command: `cd services/api && npm install && npx prisma generate`
   - Start Command: `cd services/api && npx tsx src/index.ts`
   - Instance Type: Free

#### 4B.3 Add Environment Variables
Same as Railway (Step 4.3)

#### 4B.4 Deploy Worker
1. Create another Web Service
2. Name: `taskflow-worker`
3. Build Command: `npm install && cd services/worker && npm install`
4. Start Command: `cd services/worker && npx tsx src/index.ts`
5. Add environment variables

---

## STEP 5: Deploy Frontend (Vercel) ⚡

### Option A: Vercel (Recommended for Frontend)

#### 5.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

#### 5.2 Import Project
1. Click "Add New..." → "Project"
2. Import your `taskflow` GitHub repository
3. Vercel auto-detects it's a Next.js app

#### 5.3 Configure Project
1. Framework Preset: Next.js
2. Root Directory: `frontend`
3. Build Command: (leave default)
4. Output Directory: (leave default)

#### 5.4 Add Environment Variable
1. Click "Environment Variables"
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-api-url.railway.app
   ```
   (Use the URL from Step 4.5)

#### 5.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like `https://taskflow.vercel.app`

---

### Option B: Render (If Using Render for Everything)

#### 5B.1 Create Static Site
1. In Render dashboard, click "New" → "Static Site"
2. Connect your GitHub repo
3. Settings:
   - Name: `taskflow-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next`

#### 5B.2 Add Environment Variables
1. Click "Environment"
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com
   ```

#### 5B.3 Deploy
1. Click "Create Static Site"
2. Wait 3-5 minutes
3. You'll get a URL like `https://taskflow-frontend.onrender.com`

**Note:** For Next.js on Render, you need a Web Service (not Static Site). Alternative config:
- Service Type: Web Service
- Build Command: `cd frontend && npm install && npm run build`
- Start Command: `cd frontend && npm start`
- Instance Type: Free

---

## STEP 6: Run Migrations 🗄️

### 6.1 From Railway Dashboard
1. Go to your API service in Railway
2. Click "Settings" → "Deploy Triggers"
3. Add a run command:
   ```
   npx prisma migrate deploy --schema=services/api/prisma/schema.prisma
   ```

### OR 6.2 From Local (with production DB)
```bash
cd "C:\Users\Khushi\OneDrive\Documents\TaskFlow- Distributed Task Scheduler"
$env:DATABASE_URL="<your-neon-connection-string>"
npx prisma migrate deploy --schema=services/api/prisma/schema.prisma
```

---

## STEP 7: Test Everything ✅

### 7.1 Test Frontend
1. Open your Vercel URL
2. You should see the TaskFlow landing page
3. Click "Sign up" and create an account

### 7.2 Test Backend
1. Try to register/login
2. Create a test task
3. Check if it appears in the dashboard

### 7.3 Check Services Status
**Railway:**
- All 3 services should show "Active" ✓

**Vercel:**
- Deployment should show "Ready"

### 7.4 View Logs
**Railway:**
1. Click on each service
2. Click "Logs" tab
3. Look for errors (there should be none!)

**Vercel:**
1. Click "Deployments"
2. Click on latest deployment
3. Check "Function Logs"

---

## 🎉 You're Live! 

Your TaskFlow is now deployed:
- **Frontend**: https://your-app.vercel.app
- **API**: https://your-api.railway.app
- **Database**: Neon (managed)
- **Redis**: Upstash (managed)

---

## 📊 Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| **Vercel** | 100 GB bandwidth/month, unlimited projects |
| **Railway** | $5 credit/month (~550 hours) |
| **Neon** | 3 GB storage, 100 hours compute/month |
| **Upstash** | 10,000 commands/day |

**Note:** These limits are MORE than enough for a personal project or demo!

---

## 🔧 Troubleshooting

### Build Error: "Cannot find module 'autoprefixer'" (Render)
**Problem:** Frontend build fails with missing autoprefixer or other dependencies.

**Solution:**
1. Make sure you're using the correct build command:
   ```
   cd frontend && npm install && npm run build
   ```
2. For Render Web Service, ensure Root Directory is set to `frontend`
3. Or use this alternative if building from root:
   ```
   npm install --prefix frontend && cd frontend && npm run build
   ```
4. Verify `frontend/package.json` has all devDependencies:
   - autoprefixer
   - postcss
   - tailwindcss

**Quick Fix:** Push updated `frontend/package.json` with engines specified:
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
}
```

### Module not found '@/lib/api' or '@/components/ui/card'
**Problem:** TypeScript path aliases not resolving.

**Solution:**
1. Verify `frontend/tsconfig.json` has:
   ```json
   "paths": {
     "@/*": ["./src/*"]
   }
   ```
2. Check all files exist in `frontend/src/lib/` and `frontend/src/components/ui/`
3. Ensure build command runs from `frontend` directory

### Frontend not loading?
- Check environment variable `NEXT_PUBLIC_API_URL` is correct
- Redeploy in Vercel/Render
- Check browser console for API connection errors

### Backend errors?
- Check Railway logs
- Verify DATABASE_URL and Redis credentials
- Make sure migrations ran successfully

### Can't login?
- Check API service is running
- Verify JWT_SECRET is set
- Check browser console for errors

### Database connection failed?
- Verify Neon connection string includes `?sslmode=require`
- Check Neon database is active

---

## 🚀 Next Steps

1. **Custom Domain** (optional):
   - Vercel: Settings → Domains → Add your domain
   - Railway: Settings → Networking → Custom domain

2. **Set up monitoring**:
   - Railway has built-in monitoring
   - Or use your monitoring service URL

3. **Add more workers**:
   - Railway: Scale service → Add instances

4. **Backup strategy**:
   - Neon has automatic backups
   - Export important data regularly

---

## 💰 Cost Optimization Tips

1. **Stay within free tiers**:
   - Monitor Railway usage (you get $5/month)
   - One worker is usually enough to start

2. **If you exceed Railway limits**:
   - Use Render.com (has persistent free tier)
   - Or Fly.io (also has free tier)

3. **Database optimization**:
   - Clean old execution records regularly
   - Set up data retention policies

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Upstash Docs**: https://docs.upstash.com

---

## ✨ Optional Enhancements

### Add GitHub Actions for Auto-Deploy
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: echo "Railway auto-deploys on push"
```

### Set up Monitoring Alerts
1. In Railway, go to Monitoring
2. Set up alerts for:
   - High error rates
   - Service downtime
   - Resource usage

---

**Remember:** Keep your environment variables secret! Never commit them to GitHub.

Good luck with your deployment! 🎊
