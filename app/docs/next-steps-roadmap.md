# Next Steps Roadmap (Deferred)

Date: 2026-03-28
Status: Deferred for now (by decision)

## Deferred Item To Revisit

The CI optimization stream was intentionally paused for now.

Deferred scope:
- Publish coverage artifacts (`coverage/lcov.info`, `coverage/index.html`) in CI.
- Optionally split large test workloads (sharding) if runtime grows.
- Track pipeline time before and after changes to validate ROI.

Reason to defer:
- Current quality gate is already stable and green.
- Team priority now is to expand API test coverage and endpoint hardening.

## Current Baseline

- Type-check and tests are green locally.
- CI has quality gate with parallel jobs and aggregate status.
- API route coverage gap remains significant:
  - Route handlers: 48
  - Route test files: 10
  - Untested route handlers (approx): 38

## Priority Next Steps

### 1) Expand route tests for auth and account flows

Target routes:
- `/api/v1/auth/forgot-password`
- `/api/v1/auth/reset-password`
- `/api/v1/users/me`
- `/api/v1/users/me/change-password`
- `/api/v1/users/me/avatar`

Minimum cases per route:
- success path
- validation failure
- unauthorized/forbidden when protected
- response contract assertions (`data`, `meta`, error shape)

### 2) Expand route tests for scheduling and plan flows

Target routes:
- `/api/v1/classes`
- `/api/v1/classes/[id]`
- `/api/v1/sessions`
- `/api/v1/plans`
- `/api/v1/plans/[id]`
- `/api/v1/subscriptions/portal`

### 3) Expand admin route tests (high risk area)

Target routes:
- `/api/v1/admin/analytics`
- `/api/v1/admin/users`
- `/api/v1/admin/users/[id]`
- `/api/v1/admin/classes`
- `/api/v1/admin/classes/[id]`
- `/api/v1/admin/sessions`
- `/api/v1/admin/sessions/[id]`
- `/api/v1/admin/sessions/generate`
- `/api/v1/admin/bookings`
- `/api/v1/admin/bookings/[id]`
- `/api/v1/admin/subscriptions`
- `/api/v1/admin/payments`
- `/api/v1/admin/leads`
- `/api/v1/admin/leads/[id]`
- `/api/v1/admin/client-profiles`
- `/api/v1/admin/client-profiles/[userId]/assessment`

Minimum security cases:
- non-authenticated access blocked
- authenticated non-admin blocked
- admin success path

### 4) Expand support and contracts route tests

Target routes:
- `/api/v1/support/tickets`
- `/api/v1/support/tickets/[id]`
- `/api/v1/contracts`
- `/api/v1/contracts/sign`
- `/api/v1/client-profiles`
- `/api/v1/client-profiles/complete`

### 5) Contract and docs sync

- Keep OpenAPI docs aligned when route behavior changes.
- Keep changelog updated with each test-coverage wave.
- Enforce PR checklist completion for route-level tests.

## Definition Of Done For Next Iteration

- Add at least 8 new route test files from the priority list.
- Keep `npx tsc --noEmit`, `npm run test:integration`, and `npm run test:ci` green.
- Preserve coverage threshold and avoid regressions.

## Revisit Trigger For Deferred CI Work

Resume deferred CI optimization when one of these happens:
- CI total duration consistently exceeds 8-10 minutes.
- PR queue starts waiting on test runtime bottlenecks.
- Coverage report visibility becomes a recurring reviewer request.
