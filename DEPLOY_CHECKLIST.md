# 🚀 Quick Deploy Checklist

## ☑️ Pre-Deployment
- [ ] Code is working locally
- [ ] All tests pass
- [ ] Environment variables documented

## 1️⃣ Database Setup (5 min)
- [ ] Sign up at https://neon.tech
- [ ] Create PostgreSQL database
- [ ] Copy connection string
- [ ] Save in password manager

## 2️⃣ Redis Setup (3 min)
- [ ] Sign up at https://upstash.com
- [ ] Create Redis database
- [ ] Copy host, port, password
- [ ] Save credentials

## 3️⃣ GitHub (2 min)
- [ ] Create repository on GitHub
- [ ] Push code: `git push origin main`
- [ ] Verify code is visible

## 4️⃣ Backend Deploy - Railway (10 min)
- [ ] Sign up at https://railway.app
- [ ] Create project from GitHub repo
- [ ] Deploy API service
  - [ ] Add all environment variables
  - [ ] Set build/start commands
  - [ ] Generate domain
- [ ] Deploy Worker service
  - [ ] Same env variables
  - [ ] Set build/start commands
- [ ] Deploy Monitoring (optional)
- [ ] All services show "Active" ✓

## 5️⃣ Frontend Deploy - Vercel (5 min)
- [ ] Sign up at https://vercel.com
- [ ] Import GitHub repository
- [ ] Set root directory: `frontend`
- [ ] Add env var: `NEXT_PUBLIC_API_URL`
- [ ] Deploy
- [ ] Get deployment URL

## 6️⃣ Database Migration (2 min)
- [ ] Run: `npx prisma migrate deploy`
- [ ] Verify tables created in Neon dashboard

## 7️⃣ Testing (5 min)
- [ ] Open Vercel URL
- [ ] Register new account
- [ ] Login successfully
- [ ] Create a test task
- [ ] View dashboard
- [ ] Check all pages work

## ✅ Post-Deployment
- [ ] Save all URLs and credentials
- [ ] Set up monitoring alerts
- [ ] Document for team
- [ ] Celebrate! 🎉

---

## 📋 Environment Variables Checklist

### For Railway (API, Worker, Monitoring)
```env
DATABASE_URL=postgresql://...neon.tech/...
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxxxx
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
LOG_LEVEL=info
```

### For Vercel (Frontend)
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

---

## 🆘 Quick Fixes

**Can't connect to database?**
→ Check DATABASE_URL includes `?sslmode=require`

**Frontend can't reach API?**
→ Verify NEXT_PUBLIC_API_URL is correct
→ Check Railway API service is running

**Login not working?**
→ Check JWT_SECRET is set
→ Verify database migrations ran

**Worker not processing?**
→ Check REDIS credentials
→ Verify worker service is running

---

## 💡 Pro Tips

1. **Use Railway for everything if possible** - simpler to manage
2. **Enable auto-deploy** - Railway/Vercel deploy on git push
3. **Monitor Railway credits** - You get $5/month free
4. **Set up alerts** - Know when something breaks
5. **Keep .env.example updated** - Help future you

---

## 📊 Expected Deployment Time

| Step | Time | Difficulty |
|------|------|-----------|
| Database | 5 min | ⭐ Easy |
| Redis | 3 min | ⭐ Easy |
| GitHub | 2 min | ⭐ Easy |
| Backend | 10 min | ⭐⭐ Medium |
| Frontend | 5 min | ⭐ Easy |
| Testing | 5 min | ⭐ Easy |
| **TOTAL** | **~30 min** | |

---

**First time?** Follow DEPLOYMENT_COMPLETE.md for detailed guide.
**Experienced?** Use this checklist for quick reference.
