---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-02-10
---

# TODO — F9 Central Timer Sync

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-15) Validate recommended preset management location (admin console drawer) with design to ensure UX parity. ✅ Decision logged in [Feature PRD — Open Questions](featurePRD_F9.md#open-questions).
- [x] (Owner: Product | Due: 2024-02-15) Confirm QR-based sharing approach for external displays and security expectations for token expiry. ✅ Decision logged in [Feature PRD — Open Questions](featurePRD_F9.md#open-questions) & [Dev Plan — API & Integration Design](devplan_F9.md#api--integration-design).

## Implementation Tasks
- [ ] (Owner: Backend | Due: 2024-02-22) Ship Supabase migrations for `event_timer_presets`, `event_timer_state`, and `call_timer_action` RPC with RLS policies. ↗️ See [Dev Plan — Backend & Migrations](devplan_F9.md#backend--migrations).
- [x] (Owner: Codex Agent | Due: 2024-02-24) Implement timer API helpers and hooks (`useEventTimer`, `useTimerControls`) with optimistic updates and drift correction. ↗️ See [Dev Plan — Data & State Management](devplan_F9.md#data--state-management) & [API & Integration Design](devplan_F9.md#api--integration-design).
  - 2024-02-24 — Complete. Added Supabase-backed helpers, realtime subscription handling, optimistic mutation flows, drift detection, and fallback states.
- [x] (Owner: Codex Agent | Due: 2024-02-25) Build UI components (`TimerBadge`, `TimerControlPanel`, `TimerShareSheet`) and integrate within admin console & judge views. ↗️ See [Dev Plan — UI & UX Implementation](devplan_F9.md#ui--ux-implementation) & [Feature PRD — Acceptance Criteria](featurePRD_F9.md#acceptance-criteria).
  - 2024-02-24 — Complete. Delivered reusable components with accessibility affordances and integrated them into admin and judge experiences.
- [x] (Owner: Codex Agent | Due: 2024-02-26) Create `/timer` route with orientation guidance, accessibility hooks, and share-link token handling. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F9.md#architecture--flow-overview) & [UI & UX Implementation](devplan_F9.md#ui--ux-implementation).
  - 2024-02-24 — Complete. Added guarded `/timer` route with token validation, live countdown view, and orientation guidance messaging.
- [ ] (Owner: Codex Agent | Due: 2024-03-01) Replace temporary `any`-based Supabase RPC casts in `src/lib/api.ts` (`fetchTimerState`, `listTimerPresets`, `triggerTimerAction`) with generated typings once schema refresh lands. ↗️ See [Dev Plan — Data & State Management](devplan_F9.md#data--state-management) & [API & Integration Design](devplan_F9.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-03-02) Extract shared Supabase RPC wrapper utilities to remove repeated ESLint disables across timer helpers. ↗️ See [Dev Plan — Data & State Management](devplan_F9.md#data--state-management).
- [ ] (Owner: Codex Agent | Due: 2024-02-27) Persist offline cache, reconnect banners, and telemetry instrumentation for timer events. ↗️ See [Dev Plan — Data & State Management](devplan_F9.md#data--state-management) & [Rollout & Monitoring](devplan_F9.md#rollout--monitoring).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-02-28) Write unit/integration tests for timer hooks, RPC interactions, and RBAC enforcement. *(Pending — add `renderHook` coverage for `useEventTimer`/`useTimerControls`, plus `/timer` route integration once backend endpoints are stable.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F9.md#testing-strategy).
- [ ] (Owner: QA | Due: 2024-02-29) Conduct end-to-end synchronization test across multiple devices plus offline recovery scenarios. ↗️ See [Dev Plan — Testing Strategy](devplan_F9.md#testing-strategy).
- [ ] (Owner: QA | Due: 2024-02-29) Run Lighthouse/Pa11y accessibility audits on `/timer` route and timer controls. ↗️ See [Dev Plan — Testing Strategy](devplan_F9.md#testing-strategy) & [Feature PRD — Acceptance Criteria](featurePRD_F9.md#acceptance-criteria).

## Follow-ups
- [ ] (Owner: Security | Due: 2024-03-01) Review tokenized share-link mechanism and RLS adjustments for potential abuse vectors. ↗️ See [Dev Plan — Backend & Migrations](devplan_F9.md#backend--migrations) & [API & Integration Design](devplan_F9.md#api--integration-design).
- [ ] (Owner: Ops | Due: 2024-03-03) Update day-of runbook with timer fallback procedures and rehearsal checklist. ↗️ See [Dev Plan — Rollout & Monitoring](devplan_F9.md#rollout--monitoring) & [Feature PRD — Overview & Story](featurePRD_F9.md#overview--story).
