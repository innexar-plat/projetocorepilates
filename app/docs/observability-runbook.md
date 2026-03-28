# Observability Runbook

## Purpose

Define how to monitor and respond to incidents affecting client-facing backend flows.

## 1. Core Signals

### Logs

- Source: [src/lib/logger.ts](../src/lib/logger.ts)
- Format: structured JSON in production
- Required fields for triage:
  - `requestId`
  - route/context tags
  - status codes
  - domain IDs when available (userId, contractId, subscriptionId)

### Metrics (In-Memory Runtime Counters)

- Source: [src/lib/metrics.ts](../src/lib/metrics.ts)
- Counters emitted by API helper:
  - `api.errors.400`
  - `api.errors.401`
  - `api.errors.403`
  - `api.errors.404`
  - `api.errors.409`
  - `api.errors.422`
  - `api.errors.429`
  - `api.errors.500`
- Counters emitted by Stripe webhook:
  - `webhook.stripe.requests.total`
  - `webhook.stripe.requests.success`
  - `webhook.stripe.requests.failed`
  - `webhook.stripe.requests.duplicate`
  - `webhook.stripe.requests.missing_signature`
  - `webhook.stripe.requests.invalid_signature`

## 2. Alert Recommendations

### API Error Rate

- Trigger: 5xx error count above normal baseline for 5 minutes.
- Severity: High.
- Immediate action:
  - Check recent deploys.
  - Inspect logs by `requestId` and endpoint.
  - Roll back if error burst started after release.

### Stripe Webhook Failures

- Trigger: increase in `webhook.stripe.requests.failed`.
- Severity: High.
- Immediate action:
  - Validate Stripe signature secret.
  - Check DB availability and latency.
  - Check payment/subscription service errors in logs.

### Duplicate Spike

- Trigger: unusual increase in `webhook.stripe.requests.duplicate`.
- Severity: Medium.
- Immediate action:
  - Validate Stripe retry behavior and endpoint latency.
  - Confirm idempotency still preventing double-processing.

## 3. Incident Response Steps

1. Confirm impact scope (which endpoints and which users).
2. Capture 3 to 5 representative `requestId` values.
3. Identify failing dependency (DB, Stripe, Resend, MinIO).
4. Apply mitigation (rollback, temporary feature toggle, dependency failover).
5. Confirm recovery by checking error counters and success logs.
6. Publish incident summary and follow-up actions.

## 4. Post-Incident Actions

- Add missing tests that would have caught the incident.
- Add or tighten alerts for the observed failure mode.
- Update this runbook with concrete learnings.
