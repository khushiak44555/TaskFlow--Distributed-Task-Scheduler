# TaskFlow Architecture

## System Overview

TaskFlow is a distributed task scheduler built on a microservices architecture, designed for high availability, scalability, and fault tolerance.

## Architecture Principles

1. **Separation of Concerns**: Each service has a single responsibility
2. **Stateless Services**: Easy to scale horizontally
3. **Event-Driven**: Asynchronous job processing
4. **Fault Tolerant**: Automatic retries and dead-letter queues
5. **Observable**: Comprehensive metrics and logging

## Component Architecture

### 1. API Service

**Responsibilities:**
- User authentication and authorization
- Task CRUD operations
- Job scheduling
- API rate limiting
- Request validation

**Technology:**
- Express.js for HTTP server
- Prisma for database access
- JWT for authentication
- BullMQ for job queuing
- Joi for validation

**Key Features:**
- RESTful API endpoints
- JWT-based auth with refresh tokens
- Role-based access control
- Request/response logging
- Error handling middleware

**Data Flow:**
```
Client Request
    ↓
Rate Limiter
    ↓
Authentication
    ↓
Validation
    ↓
Business Logic
    ↓
Database/Queue
    ↓
Response
```

### 2. Worker Service

**Responsibilities:**
- Job execution
- Retry logic
- Error handling
- Dead-letter queue management
- Metrics collection

**Technology:**
- BullMQ Worker for job processing
- Prisma for database access
- Custom job processors

**Key Features:**
- Concurrent job processing
- Exponential backoff retries
- Timeout handling
- Graceful shutdown
- Job result persistence

**Processing Flow:**
```
Redis Queue
    ↓
Worker picks job
    ↓
Execute task
    ↓
Success? → Log result → Mark complete
    ↓
Failure? → Retry or DLQ
```

### 3. Monitoring Service

**Responsibilities:**
- Metrics collection
- System health monitoring
- Queue statistics
- Performance tracking

**Technology:**
- Express.js for HTTP server
- Prometheus client for metrics
- BullMQ for queue inspection

**Key Metrics:**
- Job throughput
- Success/failure rates
- Queue depth
- Processing latency
- System resources

### 4. Frontend Dashboard

**Responsibilities:**
- User interface
- Data visualization
- Task management
- Real-time updates

**Technology:**
- Next.js 14 (App Router)
- React Query for data fetching
- Recharts for visualization
- shadcn/ui for components

**Key Features:**
- Responsive design
- Dark/light mode
- Real-time updates
- Interactive charts
- Task CRUD interface

## Data Architecture

### Database Schema (PostgreSQL)

**Users Table:**
```sql
- id: UUID (PK)
- email: String (Unique)
- password: String (Hashed)
- firstName: String
- lastName: String
- role: Enum (ADMIN, USER)
- isActive: Boolean
- createdAt: Timestamp
- updatedAt: Timestamp
- deletedAt: Timestamp (Soft delete)
```

**Tasks Table:**
```sql
- id: UUID (PK)
- name: String
- description: String
- type: Enum (ONE_TIME, RECURRING, DELAYED)
- status: Enum (ACTIVE, PAUSED, COMPLETED, FAILED)
- cronExpression: String (For recurring)
- scheduledAt: Timestamp (For one-time/delayed)
- priority: Integer (0-10)
- payload: JSON
- maxRetries: Integer
- timeout: Integer (ms)
- rateLimit: Integer
- createdBy: UUID (FK → Users)
- createdAt: Timestamp
- updatedAt: Timestamp
- deletedAt: Timestamp
- lastRunAt: Timestamp
- nextRunAt: Timestamp
```

**JobExecutions Table:**
```sql
- id: UUID (PK)
- taskId: UUID (FK → Tasks)
- jobId: String (BullMQ job ID)
- status: Enum (PENDING, PROCESSING, COMPLETED, FAILED, RETRYING)
- startedAt: Timestamp
- completedAt: Timestamp
- duration: Integer (ms)
- attempts: Integer
- result: JSON
- error: JSON
- createdAt: Timestamp
- updatedAt: Timestamp
```

**RetryHistory Table:**
```sql
- id: UUID (PK)
- executionId: UUID (FK → JobExecutions)
- attemptNumber: Integer
- error: JSON
- retriedAt: Timestamp
```

**DeadLetterJobs Table:**
```sql
- id: UUID (PK)
- taskId: UUID (FK → Tasks)
- jobId: String
- payload: JSON
- error: JSON
- attempts: Integer
- createdAt: Timestamp
```

### Queue Architecture (Redis)

**Queue Structure:**
```
taskflow:tasks
├── waiting      # Jobs waiting to be processed
├── active       # Currently processing
├── completed    # Successfully completed
├── failed       # Failed jobs
└── delayed      # Scheduled for future

taskflow:dead-letter
└── waiting      # Jobs that exhausted retries
```

**Job Data Structure:**
```json
{
  "id": "task-uuid-timestamp",
  "name": "task-uuid",
  "data": {
    "taskId": "uuid",
    "payload": {}
  },
  "opts": {
    "attempts": 3,
    "backoff": {
      "type": "exponential",
      "delay": 1000
    },
    "priority": 5,
    "timeout": 30000
  }
}
```

## Communication Patterns

### Synchronous Communication
- Client ↔ API: HTTP/REST
- API ↔ Database: SQL (Prisma)
- Monitoring ↔ Redis: Direct connection

### Asynchronous Communication
- API → Queue: Job publishing
- Queue → Worker: Job consumption
- Worker → Database: Result persistence

## Scalability Architecture

### Horizontal Scaling

**API Service:**
- Multiple replicas behind load balancer
- Stateless design
- Shared database connection pool

**Worker Service:**
- Multiple workers consuming from same queue
- Concurrency per worker configurable
- Auto-scaling based on queue depth

**Frontend:**
- Multiple replicas behind load balancer
- CDN for static assets
- Server-side rendering

### Vertical Scaling

**Database:**
- Increase CPU/RAM
- Add read replicas
- Implement connection pooling

**Redis:**
- Increase memory
- Enable persistence
- Use Redis Cluster for sharding

## High Availability

### Redundancy
- Multiple API replicas
- Multiple worker replicas
- Database replication (primary + replicas)
- Redis persistence (AOF + RDB)

### Fault Tolerance
- Automatic job retries
- Dead-letter queue for failed jobs
- Health checks and auto-restart
- Graceful degradation

### Disaster Recovery
- Database backups (daily)
- Point-in-time recovery
- Redis snapshots
- Kubernetes pod disruption budgets

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. API validates against database
3. Generate JWT with user claims
4. Return token to client
5. Client includes token in subsequent requests
6. API validates token on each request
```

### Authorization Layers
- Route-level authentication
- Role-based access control
- Resource ownership validation
- Rate limiting per user

### Data Security
- Passwords hashed with bcrypt
- JWT signed with secret key
- Environment variables for secrets
- Encrypted database connections
- HTTPS in production

## Monitoring Architecture

### Metrics Collection
```
Services
    ↓
Prometheus Client (In-process)
    ↓
Push metrics to registry
    ↓
Prometheus Server (Scrapes)
    ↓
Grafana (Visualizes)
```

### Log Aggregation
```
Services (Pino)
    ↓
Structured JSON logs
    ↓
(Optional) Log aggregator (ELK, Loki)
    ↓
Searchable logs
```

### Tracing
```
Request ID generation
    ↓
Pass through all services
    ↓
Log with context
    ↓
Distributed tracing
```

## Deployment Architecture

### Development
```
Local Machine
├── API (Node process)
├── Worker (Node process)
├── Monitoring (Node process)
├── Frontend (Next.js dev server)
├── PostgreSQL (Docker)
└── Redis (Docker)
```

### Docker Compose
```
Docker Host
├── api (Container)
├── worker (Container × 2)
├── monitoring (Container)
├── frontend (Container)
├── postgres (Container + Volume)
├── redis (Container + Volume)
├── prometheus (Container)
└── grafana (Container)
```

### Kubernetes
```
Kubernetes Cluster
├── Namespace: taskflow
├── StatefulSet: postgres (+ PVC)
├── StatefulSet: redis (+ PVC)
├── Deployment: api (× 2 pods)
├── Deployment: worker (× 3 pods, HPA)
├── Deployment: monitoring (× 1 pod)
├── Deployment: frontend (× 2 pods)
├── Services (LoadBalancer)
└── ConfigMaps + Secrets
```

## Performance Optimization

### Database
- Indexed columns (email, taskId, status, createdAt)
- Connection pooling
- Query optimization
- Prepared statements (via Prisma)

### Queue
- Redis pipelining
- Batch job processing
- Priority queues
- Rate limiting

### API
- Response compression
- Caching headers
- Pagination
- Field selection

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN usage
- Static generation where possible

## Future Enhancements

1. **Multi-tenancy**: Separate data per organization
2. **Webhooks**: Notify external systems on job completion
3. **Plugin System**: Custom job processors
4. **API Gateway**: Centralized routing and auth
5. **Event Sourcing**: Complete audit trail
6. **GraphQL API**: Alternative to REST
7. **Real-time Updates**: WebSocket for live data
8. **Advanced Scheduling**: Dependency graphs, conditional execution
9. **Data Encryption**: At-rest and in-transit
10. **Multi-region**: Geographic distribution
