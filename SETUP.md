# TaskFlow Setup Guide

## Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker-compose up -d

# 3. Wait for services to be ready (30 seconds)
docker-compose logs -f

# 4. Run database migrations
docker-compose exec api npx prisma migrate deploy

# 5. Access services
# Frontend: http://localhost:3003
# API: http://localhost:3001
# Bull Board: http://localhost:3001/admin/queues
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
```

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL and Redis
docker-compose up -d postgres redis

# 3. Copy environment file
cp .env.example .env

# 4. Run database migrations
cd services/api
npx prisma migrate dev
cd ../..

# 5. Start all services
npm run dev
```

## Detailed Setup

### Prerequisites Installation

#### Node.js & npm
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

#### PostgreSQL
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

### Environment Configuration

Create `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Services
API_PORT=3001
MONITORING_PORT=3002
WORKER_CONCURRENCY=10

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
LOG_LEVEL=debug
```

### Database Setup

```bash
# Navigate to API service
cd services/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed

# Open Prisma Studio to view data
npx prisma studio
```

### Starting Services Individually

#### API Service
```bash
cd services/api
npm install
npm run dev
# Running on http://localhost:3001
```

#### Worker Service
```bash
cd services/worker
npm install
npm run dev
# Workers started with concurrency: 10
```

#### Monitoring Service
```bash
cd services/monitoring
npm install
npm run dev
# Running on http://localhost:3002
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","services":{...}}
```

### 2. Create a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
# Save the token from response
```

### 4. Create a Task
```bash
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Task",
    "type": "ONE_TIME",
    "scheduledAt": "2024-12-31T10:00:00Z",
    "payload": {"message": "Hello World"}
  }'
```

### 5. View in Bull Board
Open http://localhost:3001/admin/queues to see your tasks in the queue.

## Kubernetes Deployment

### Prerequisites
- kubectl installed
- Kubernetes cluster (minikube, EKS, GKE, AKS)
- Docker images built and pushed to registry

### Build and Push Images

```bash
# Build images
docker build -t your-registry/taskflow-api:latest -f services/api/Dockerfile .
docker build -t your-registry/taskflow-worker:latest -f services/worker/Dockerfile .
docker build -t your-registry/taskflow-monitoring:latest -f services/monitoring/Dockerfile .
docker build -t your-registry/taskflow-frontend:latest -f frontend/Dockerfile .

# Push to registry
docker push your-registry/taskflow-api:latest
docker push your-registry/taskflow-worker:latest
docker push your-registry/taskflow-monitoring:latest
docker push your-registry/taskflow-frontend:latest
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (update with your values first!)
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy databases
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n taskflow --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n taskflow --timeout=300s

# Run migrations
kubectl run -it --rm migrate --image=your-registry/taskflow-api:latest \
  --restart=Never -n taskflow \
  --command -- npx prisma migrate deploy

# Deploy services
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/monitoring-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check status
kubectl get pods -n taskflow
kubectl get services -n taskflow

# Get external IPs
kubectl get svc -n taskflow
```

### Access Services

```bash
# Port forward API
kubectl port-forward -n taskflow svc/api-service 3001:80

# Port forward Frontend
kubectl port-forward -n taskflow svc/frontend-service 3000:80

# Port forward Monitoring
kubectl port-forward -n taskflow svc/monitoring-service 3002:3002
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check logs
docker-compose logs postgres
```

#### 2. Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# Check logs
docker-compose logs redis
```

#### 3. Port Already in Use
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### 4. Prisma Migration Issues
```bash
# Reset database (WARNING: deletes all data)
cd services/api
npx prisma migrate reset

# Or manually
npx prisma db push --force-reset
```

#### 5. Worker Not Processing Jobs
```bash
# Check worker logs
docker-compose logs worker

# Check Redis queue
redis-cli
> KEYS bull:taskflow:*
> LLEN bull:taskflow:tasks:wait
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api
docker-compose logs -f worker

# View last 100 lines
docker-compose logs --tail=100 api
```

### Monitoring

1. **Prometheus**: http://localhost:9090
   - Query: `taskflow_jobs_processed_total`
   - Query: `rate(taskflow_jobs_completed_total[5m])`

2. **Grafana**: http://localhost:3000
   - Username: admin
   - Password: admin
   - Add Prometheus datasource
   - Import dashboards

3. **Bull Board**: http://localhost:3001/admin/queues
   - Monitor queues in real-time
   - View job details
   - Retry failed jobs

## Performance Tuning

### Worker Concurrency
```env
WORKER_CONCURRENCY=20  # Increase for more throughput
```

### Database Connection Pool
```typescript
// services/api/src/utils/db.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  connection: {
    poolSize: 20,  // Adjust based on load
  },
});
```

### Redis Configuration
```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Security Hardening

### Production Checklist

- [ ] Change default JWT_SECRET
- [ ] Use strong database passwords
- [ ] Enable Redis password authentication
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS for all services
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Enable audit logging
- [ ] Regular security updates

## Next Steps

1. **Customize Task Processors**: Edit `services/worker/src/processors/task.processor.ts`
2. **Add Custom Routes**: Create new routes in `services/api/src/routes/`
3. **Create Dashboards**: Add pages to `frontend/src/app/dashboard/`
4. **Configure Alerts**: Set up Prometheus alerting rules
5. **Scale Workers**: Adjust replicas in Kubernetes or docker-compose

## Support

- GitHub Issues: https://github.com/yourusername/taskflow/issues
- Documentation: See README.md
- Email: support@taskflow.io
