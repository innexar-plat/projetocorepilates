# Production Readiness Guide

## Scope

This guide defines the minimum requirements to run the API safely in production for client-facing workflows.

## 1. Deployment Checklist

- Run database migrations before rollout.
- Verify environment variables from [.env.example](../.env.example).
- Validate secrets are injected by the platform, not committed.
- Run pre-deploy gates:
  - `npx tsc --noEmit`
  - `npx jest --coverage --coverageReporters="text-summary"`
- Enable HTTPS/TLS termination.
- Restrict CORS origins to known frontends.

## 2. Error Handling Standards

- Use domain errors from [src/lib/errors.ts](../src/lib/errors.ts).
- Use [src/lib/api.ts](../src/lib/api.ts) helpers for route responses.
- Always return consistent error contract with `requestId`, `statusCode`, `error`, and `message`.
- Never leak stack traces in production responses.

## 3. Stripe Webhook Hardening

Current protections in [src/app/api/webhooks/stripe/route.ts](../src/app/api/webhooks/stripe/route.ts):

- Signature validation.
- Idempotency key guard per Stripe event id.
- Duplicate delivery detection.
- Best-effort flows with warning logs.
- Unified API error handling for failures.

Important note:

- Idempotency store is currently in-memory.
- For multi-instance deployments, migrate idempotency state to Redis or database.

## 4. Observability Requirements

- Structured JSON logs with pino from [src/lib/logger.ts](../src/lib/logger.ts).
- Runtime counters from [src/lib/metrics.ts](../src/lib/metrics.ts).
- Error counters incremented by [src/lib/api.ts](../src/lib/api.ts).
- Webhook counters incremented by [src/app/api/webhooks/stripe/route.ts](../src/app/api/webhooks/stripe/route.ts).

## 5. Security Baseline

- Keep `NEXTAUTH_SECRET` strong and rotated.
- Verify `STRIPE_WEBHOOK_SECRET` per environment.
- Set `NODE_ENV=production` in production.
- Restrict database user permissions.
- Do not log secrets or raw credentials.

## 6. Reliability Baseline

- Treat email and referral flows as best-effort.
- Log failures with context for retries/manual follow-up.
- Keep Stripe webhook handler idempotent and retry-safe.

## 7. Go-Live Checklist

- [ ] Environment variables configured.
- [ ] Migrations applied.
- [ ] Health endpoint responds successfully.
- [ ] Alerting configured for elevated 5xx rates.
- [ ] Alerting configured for webhook failed events.
- [ ] Runbook reviewed by on-call owner.
