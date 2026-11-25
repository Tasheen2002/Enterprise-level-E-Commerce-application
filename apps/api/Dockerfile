# Node.js 24 is the active LTS line (Node.js 20 reached end of life in April 2026).
# --- Stage 1: Base Environment ---
FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Stage 2: Builder ---
FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile

# Generate Prisma database client
RUN pnpm exec prisma generate

# --- Stage 3: Runner (Production execution) ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy necessary workspace files to run with tsx resolving paths. Files stay
# root-owned and are read-only for the unprivileged runtime user.
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/modules ./modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

USER node
EXPOSE 3001

# Liveness only: /health does not depend on the database (use /ready for that).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3001/health || exit 1

# Node is the container's main process so SIGTERM reaches the API's graceful
# shutdown handlers directly (no npx/tsx wrapper process in between).
CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
