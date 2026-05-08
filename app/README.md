# Brazilian Core Pilates - Backend and API

Backend API for subscriptions, bookings, classes, client onboarding, contracts, payments, referrals, and support.

This app now includes reusable frontend surfaces for:

- Website (`/[locale]`, `/[locale]/planos`, `/[locale]/aulas`, `/[locale]/contato`)
- Client portal (`/[locale]/portal/*`)
- Admin panel (`/[locale]/admin/*`)

## Requirements

- Node.js >= 20
- PostgreSQL >= 15
- npm >= 10

## Installation and Setup

```bash
git clone <repository-url>
cd app
cp .env.example .env
npm install
npm run db:generate
npm run dev
```

## Run with Docker (Backend + PostgreSQL)

```bash
cp .env.docker.example .env.docker
docker compose up -d --build
```

Services:

- Backend: http://localhost:3000
- PostgreSQL: localhost:5432 (db `core_pilates`, user `postgres`, password `postgres`)

Useful commands:

```bash
docker compose ps
docker compose logs app -f
docker compose down
docker compose down -v
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_APP_URL | Public base URL used in email links | http://localhost:3000 |
| NEXTAUTH_URL | Base URL for auth callbacks | http://localhost:3000 |
| NEXTAUTH_SECRET | NextAuth secret key | long-random-secret |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/core_pilates |
| STRIPE_SECRET_KEY | Stripe secret key | sk_test_xxx |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | whsec_xxx |
| STRIPE_WEBHOOK_IDEMPOTENCY_TTL_MS | Stripe event idempotency retention in memory | 86400000 |
| RESEND_API_KEY | Resend API key | re_xxx |
| MINIO_ENDPOINT | MinIO host | localhost |
| MINIO_PORT | MinIO port | 9000 |
| MINIO_ACCESS_KEY | MinIO access key | minioadmin |
| MINIO_SECRET_KEY | MinIO secret key | minioadmin |
| LOG_LEVEL | Pino logging level | debug |

## Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server |
| npm run build | Build production bundle |
| npm run start | Start production server |
| npm run lint | Run lint checks |
| npm run test | Run test suite |
| npm run test:ci | Run CI test gate with coverage summary |
| npm run test:integration | Run integration flow tests |
| npm run test:coverage | Run tests with coverage |
| npm run db:generate | Generate Prisma client |
| npm run db:migrate | Run Prisma migrations |
| npm run db:push | Push Prisma schema to database |
| npm run db:studio | Open Prisma Studio |

## Project Structure

```text
src/
	app/api/                    # Next.js route handlers
	app/[locale]/               # Localized frontend routes
	components/                 # Reusable atoms/molecules/organisms/layout/sections
	hooks/                      # Shared frontend hooks
	services/                   # Frontend API clients (real backend connection)
	modules/
		users/
		subscriptions/
		bookings/
		classes/
		contracts/
		client-profiles/
		payments/
		leads/
		referrals/
		support/
	lib/
		api.ts                    # API response and error contract
		errors.ts                 # Domain error classes
		logger.ts                 # Structured logging
		metrics.ts                # In-memory counters for runtime observability
		idempotency.ts            # In-memory idempotency guard
	test/
		__mocks__/db.ts           # Global Prisma mock for tests
	utils/
		cn.ts                     # Shared utility for class composition
```

## Frontend Organization

Reusable UI and data flow follows:

```
Page -> Section Component -> Hook -> Service -> /api/v1 endpoint
```

Main frontend services:

- `src/services/website.service.ts`
- `src/services/portal.service.ts`
- `src/services/admin.service.ts`
- `src/services/auth.service.ts`

Main frontend shells:

- `src/components/layout/SiteHeader.tsx`
- `src/components/layout/AppShell.tsx`

## API Error Contract

All errors should follow this structure:

```json
{
	"requestId": "uuid",
	"statusCode": 400,
	"error": "Bad Request",
	"message": "Validation failed",
	"details": [{ "field": "email", "message": "Invalid email" }]
}
```

## Production Readiness

This project includes:

- Structured logging with pino
- Unified API error handling helpers
- Stripe webhook idempotency guard
- Runtime metrics counters for API errors and Stripe webhook outcomes
- 100% test coverage on current collected scope

See detailed guides:

- [docs/production-readiness.md](docs/production-readiness.md)
- [docs/observability-runbook.md](docs/observability-runbook.md)
- [docs/next-steps-roadmap.md](docs/next-steps-roadmap.md)

## Testing

```bash
npx tsc --noEmit
npx jest --coverage --coverageReporters="text-summary"
```

## Gallery Upload (Admin + MinIO)

The admin gallery now supports:

- Single image upload
- Bulk image upload (multiple files in one request)
- Automatic MinIO storage with DB record creation

Endpoint:

- `POST /api/v1/admin/gallery/upload`

Request format:

- `Content-Type: multipart/form-data`
- `files`: one or many image files (`image/jpeg`, `image/png`, `image/webp`)
- Optional metadata:
- `title`: base title used for uploaded images
- `altText`: shared alt text
- `order`: base order (incremented automatically for batch uploads)
- `isActive`: `true` or `false`

Response format:

- `201 Created`
- `data.created`: images successfully uploaded and persisted
- `data.failed`: files rejected with reason (partial success supported)

## Stripe Webhook Local Setup

1. Keep the app running locally on `http://localhost:3000`.
2. In another terminal, run:

```bash
npm run stripe:listen:print-secret
```

3. Copy the `whsec_...` output and set it in [app/.env](.env):

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

4. Restart the app after updating env values.
5. Start webhook forwarding (without printing secret):

```bash
npm run stripe:listen
```

6. Trigger test events:

```bash
npm run stripe:trigger:checkout
npm run stripe:trigger:invoice-paid
```

Forward target used by the app:

- `POST /api/webhooks/stripe`

## CI Quality Gate

Main workflow file: `../.github/workflows/app-ci.yml`

The pipeline runs three checks in parallel and blocks merges when any check fails:

```bash
npm ci
npx tsc --noEmit
npm run test:integration
npm run test:ci
```

Workflow jobs:

- `prepare-dependencies`: runs `npm ci` once and shares `node_modules` as artifact
- `type-check`: TypeScript compile checks
- `integration-tests`: critical API flow integration suite
- `coverage-tests`: full Jest coverage gate
- `quality-gate`: final aggregate status (depends on all jobs above)

Additional behavior:

- CI cancels superseded runs on the same branch/PR (`cancel-in-progress: true`)

Integration flow coverage is also available with:

```bash
npm run test:integration
```

## Contribution

1. Create a feature branch from develop
2. Keep commits small and follow Conventional Commits
3. Update tests and docs in the same PR
4. Ensure lint, type-check, and test suite are green
