# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/worker/package.json ./services/worker/
COPY services/api/prisma ./services/api/prisma

# Install dependencies
RUN npm install --workspace=services/worker

# Copy source
COPY services/worker ./services/worker
COPY tsconfig.json ./

# Generate Prisma client
WORKDIR /app/services/api
RUN npx prisma generate

# Build worker
WORKDIR /app/services/worker
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/worker/package.json ./services/worker/

# Install production dependencies
RUN npm install --workspace=services/worker --omit=dev

# Copy built files and prisma
COPY --from=builder /app/services/worker/dist ./services/worker/dist
COPY --from=builder /app/services/api/node_modules/.prisma ./services/api/node_modules/.prisma

WORKDIR /app/services/worker

CMD ["node", "dist/index.js"]
