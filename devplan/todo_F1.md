---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-08-24
---

# TODO — F1 Auth (Magic Link + PIN)

## Clarifications & Inputs
- [x] (Owner: Codex Agent | Due: 2024-02-05) Confirm magic link eligibility whitelist approach with product/ops. — Decision logged: open request form with roster-gated Supabase verification. ↗️ See [Feature PRD — Open Questions #1](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).
- [x] (Owner: Codex Agent | Due: 2024-02-05) Finalize PIN provisioning workflow and length requirements with ops/security. — Decision logged: organizer-assigned single-use PINs with nightly rotation. ↗️ See [Feature PRD — Open Questions #2](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).
- [x] (Owner: Codex Agent | Due: 2024-02-05) Define lost-device recovery flow (self-service vs. organizer intervention) for documentation. — Decision logged: ops console handles resets and reissues. ↗️ See [Feature PRD — Open Questions #3](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).

## Implementation Tasks
- [x] (Owner: Codex Agent | Due: 2024-02-12) Build `/auth` route with magic link request UI and PIN fallback entry. *(Completed — Codex Agent, 2024-08-24: Implemented `AuthPage` with reusable `EmailMagicLinkForm` and `PinEntryForm` components, responsive layout, and offline-aware banner messaging.)* ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F1.md#architecture--flow-overview) & [UI Components & UX Details](devplan_F1.md#ui-components--ux-details).
- [x] (Owner: Codex Agent | Due: 2024-02-12) Extend Supabase integration (API wrappers + context) for session management and instrumentation. *(Completed — Codex Agent, 2024-08-24: Added `requestMagicLink`, `verifyPin`, session helpers, and `logAuthEvent` to `src/lib/api.ts` with shared client management utilities.)* ↗️ See [Dev Plan — Data & State Management](devplan_F1.md#data--state-management) & [API & Integration Design](devplan_F1.md#api--integration-design).
- [x] (Owner: Codex Agent | Due: 2024-02-12) Implement Supabase migration / edge function for PIN verification with rate limiting. *(Completed — Codex Agent, 2024-08-24: Added `supabase/migrations/202402120001_add_auth_pin_infra.sql` and Edge Function `supabase/functions/verify-pin/index.ts` with hashed PIN validation, rate limiting, and audit logging.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F1.md#backend--migrations).
- [x] (Owner: Codex Agent | Due: 2024-02-13) Develop tests (unit, component, integration, security) covering auth flows. *(Completed — Codex Agent, 2024-08-24: Added Vitest suites for API helpers and `AuthPage` interactions, exercising success, error, and sanitisation paths.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F1.md#testing-strategy).
- [x] (Owner: Codex Agent | Due: 2024-02-13) Document monitoring and fallback guidance for ops team. *(Completed — Codex Agent, 2024-08-24: Authored `docs/auth-monitoring-runbook.md` capturing dashboards, alerts, and manual fallback steps for ops.)* ↗️ See [Feature PRD — Dependencies](featurePRD_F1.md#dependencies) & [Dev Plan — Open Items & Follow-ups](devplan_F1.md#open-items--follow-ups).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-15) Coordinate with Feature F13 for final RLS and auditing alignment once auth flows are implemented. *(Pending — awaiting backend schedule to review shared policies.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F1.md#backend--migrations).

