# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/monitoring/package.json ./services/monitoring/
COPY services/api/prisma ./services/api/prisma

# Install dependencies
RUN npm install --workspace=services/monitoring

# Copy source
COPY services/monitoring ./services/monitoring
COPY tsconfig.json ./

# Generate Prisma client
WORKDIR /app/services/api
RUN npx prisma generate

# Build monitoring
WORKDIR /app/services/monitoring
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/monitoring/package.json ./services/monitoring/

# Install production dependencies
RUN npm install --workspace=services/monitoring --omit=dev

# Copy built files and prisma
COPY --from=builder /app/services/monitoring/dist ./services/monitoring/dist
COPY --from=builder /app/services/api/node_modules/.prisma ./services/api/node_modules/.prisma

WORKDIR /app/services/monitoring

EXPOSE 3002

CMD ["node", "dist/index.js"]
