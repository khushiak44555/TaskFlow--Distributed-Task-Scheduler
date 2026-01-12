# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/api/package.json ./services/api/

# Install dependencies
RUN npm install --workspace=services/api

# Copy source
COPY services/api ./services/api
COPY tsconfig.json ./

# Generate Prisma client
WORKDIR /app/services/api
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY services/api/package.json ./services/api/

# Install production dependencies only
RUN npm install --workspace=services/api --omit=dev

# Copy built files and prisma
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/node_modules/.prisma ./services/api/node_modules/.prisma
COPY services/api/prisma ./services/api/prisma

WORKDIR /app/services/api

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3001

CMD ["node", "dist/index.js"]
