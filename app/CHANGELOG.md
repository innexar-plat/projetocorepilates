# Changelog

## [Unreleased] - 2026-03-28

### Added

- In-memory idempotency guard for Stripe webhook event IDs.
- Runtime metrics utility for API and webhook counters.
- Tests for API force-status error consistency.
- Tests for idempotency utility.
- Webhook route tests for missing signature and duplicate event handling.
- Production readiness and observability runbook documentation.
- Critical API flow integration test suite (register, referral apply, checkout, cancel).
- CI workflow for app quality gate (`npm ci`, `tsc --noEmit`, and coverage tests).
- PR checklist template enforcing route test coverage and quality gate adherence.
- Deferred roadmap document with prioritized next API testing steps.
- Route test suites for auth/account endpoints: forgot password, reset password, profile retrieval, password change, and avatar upload.
- Route test suites for classes, sessions, plans, and subscription portal endpoints, including dynamic `[id]` route coverage.

### Changed

- Stripe webhook error responses now use unified API error helpers.
- API error helper now increments metrics and keeps forced status/body contract consistent.
- Registration best-effort flows now log failures with context.
- README replaced with backend-focused operational documentation.
- `.env.example` updated with logging and webhook idempotency configuration.
- App CI workflow now runs type-check, integration tests, and coverage tests in parallel with an aggregate quality gate.
- App CI now prepares dependencies once and reuses `node_modules` artifact across parallel jobs, with superseded runs auto-cancelled.

### Fixed

- Resolved mismatch risk between forced HTTP status and error payload content.
