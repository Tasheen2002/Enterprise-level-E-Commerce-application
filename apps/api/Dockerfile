# --- Stage 1: Base Environment ---
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Stage 2: Builder ---
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma database client
RUN npx prisma generate

# --- Stage 3: Runner (Production execution) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary workspace files to run with tsx resolving paths
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/modules ./modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3001

CMD ["npx", "tsx", "apps/api/src/index.ts"]
