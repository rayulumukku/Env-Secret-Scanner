# ==============================================================================
# SecretShield — Production Multi-Stage Container Image
# ==============================================================================

# 1. Base Dependencies Stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace and package descriptors
COPY package*.json ./
COPY app-src/package*.json ./app-src/
COPY packages/scanner/package*.json ./packages/scanner/
COPY packages/cli/package*.json ./packages/cli/
COPY packages/config/package*.json ./packages/config/
COPY extensions/vscode/package*.json ./extensions/vscode/

RUN npm ci

# 2. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build web application
WORKDIR /app/app-src
RUN npm run build

# 3. Production Runner Stage (Non-Root)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy essential runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app-src ./app-src
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000

WORKDIR /app/app-src
CMD ["npm", "start"]
