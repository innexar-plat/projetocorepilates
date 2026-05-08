FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

FROM base AS build
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
	npm run build -- --no-lint

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["npm", "run", "start"]
