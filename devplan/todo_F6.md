---
owner: Codex Agent
status: in_progress
last_reviewed: 2025-02-14
---

# TODO — F6 Submit & Locking (+ Unlock Requests)

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-20) Finalize unlock reason requirement and admin notification treatment per Master PRD TODO. ✅ Adopted optional note & admin-console surfacing decisions on 2024-02-12. ↗️ See [Feature PRD — Open Questions](featurePRD_F6.md#open-questions).
- [x] (Owner: Engineering | Due: 2024-02-21) Confirm Supabase audit storage approach and RPC contracts for submit/unlock flows. ✅ Extending `ballot_audit` with new action types confirmed on 2024-02-12. ↗️ See [Feature PRD — Open Questions](featurePRD_F6.md#open-questions) & [Dev Plan — Backend & Migrations](devplan_F6.md#backend--migrations).

## Implementation Tasks
- [x] (Owner: Codex Agent | Due: 2024-02-23) Implement `submit_ballot` Supabase function, audit logging updates, and `ballot_unlock_requests` migration with RLS rules. *(Completed — Codex Agent, 2025-02-14: Added ballot unlock tables, audit trail, and submission/request RPCs via migration `20251029100935_create_ballot_unlock_and_audit_system.sql`.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F6.md#backend--migrations).
- [x] (Owner: Codex Agent | Due: 2024-02-23) Extend `src/lib/api.ts`, scoring context, and autosave queue to handle submit/lock lifecycle and realtime subscriptions. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F6.md#architecture--flow-overview) & [API & Integration Design](devplan_F6.md#api--integration-design).
  - ✅ 2024-02-23 — Implemented `ballot-lifecycle` helper with local persistence, storage-event broadcasts, and a `useBallotLifecycle` hook powering submission, locking, and unlock subscription behaviour on the Score page.
- [x] (Owner: Codex Agent | Due: 2024-02-24) Build submit button, unlock sheet components, and pending state banners with accessibility support. ↗️ See [Dev Plan — UI States & UX Messaging](devplan_F6.md#ui-states--ux-messaging) & [Validation & Error Handling](devplan_F6.md#validation--error-handling).
  - ✅ 2024-02-23 — Delivered score submission acknowledgement variants, lifecycle-driven banners, and an accessible unlock request sheet with focus management and error messaging.
- [ ] (Owner: Codex Agent | Due: 2024-02-24) Wire offline finalize queue behavior and unlock request retry handling. *(In progress — local queue persistence exists, but background flush/retry logic still TODO.)* ↗️ See [Dev Plan — Data & State Management](devplan_F6.md#data--state-management) & [Validation & Error Handling](devplan_F6.md#validation--error-handling).

## Testing & QA
- [x] (Owner: Codex Agent | Due: 2024-02-25) Add unit/integration tests covering submit lifecycle, realtime updates, and unlock sheet validation. *(Completed — Codex Agent, 2024-08-24: `score-page` Vitest suite exercises submission locking, unlock requests, approvals, and queued payload behaviour.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F6.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-25) Perform offline/online transition tests plus accessibility review (screen reader + keyboard) for submit/unlock flows. *(Pending — manual accessibility + offline QA not yet run.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F6.md#testing-strategy) & [Feature PRD — Acceptance Criteria](featurePRD_F6.md#acceptance-criteria).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-26) Sync with F8 admin console team to ensure unlock request queue and decision actions consume the new APIs. *(Pending — needs API contract once Supabase functions exist.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F6.md#open-items--follow-ups).
- [ ] (Owner: Analytics | Due: 2024-02-26) Define telemetry events (`ballot_submit_success`, `unlock_request_created`, `unlock_request_resolved`) and dashboards. *(Pending — analytics backlog.)* ↗️ See [Feature PRD — Success Metrics](featurePRD_F6.md#success-metrics) & [Dev Plan — Open Items & Follow-ups](devplan_F6.md#open-items--follow-ups).
