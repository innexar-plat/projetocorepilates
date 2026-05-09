# syntax=docker/dockerfile:1.6
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- deps ----------
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --prefer-offline

# ---------- build ----------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_pilates npx prisma generate
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/core_pilates \
    NEXTAUTH_URL=http://localhost:3000 \
    NEXTAUTH_SECRET=docker-build-secret \
    STRIPE_SECRET_KEY=sk_test_placeholder \
    STRIPE_WEBHOOK_SECRET=whsec_test_placeholder \
    RESEND_API_KEY=re_test_placeholder \
    MINIO_ENDPOINT=localhost \
    MINIO_ACCESS_KEY=minioadmin \
    MINIO_SECRET_KEY=minioadmin \
    NEXT_TELEMETRY_DISABLED=1 \
    npm run build -- --no-lint

# ---------- runtime (standalone, slim) ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# standalone server bundle (inclui apenas deps necessárias)
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# prisma runtime (engine + client gerado)
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
CMD ["node", "server.js"]
