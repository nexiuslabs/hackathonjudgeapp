---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-02-13
---

# TODO — F8 Admin Console (Responsive)

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-20) Resolve Master PRD TODO on depth of progress data (status-only vs per-criterion) to finalize grid schema. ✅ 2024-02-13 — Adopt status-first grid with drill-in detail drawers per Master PRD decision. ↗️ See [Master PRD — F8](masterPRD.md#f8--admin-console-responsive-p0) decision & [Feature PRD — Decisions & Rationale](featurePRD_F8.md#decisions--rationale).
- [x] (Owner: Product | Due: 2024-02-20) Confirm required filters/search facets for large events to lock responsive list design. ✅ 2024-02-13 — Commit to multi-select filters for track, judge cohort, and status. ↗️ See [Master PRD — F8](masterPRD.md#f8--admin-console-responsive-p0) decision & [Feature PRD — Decisions & Rationale](featurePRD_F8.md#decisions--rationale).
- [x] (Owner: Product | Due: 2024-02-20) Decide which admin actions ship with F8 vs later features (normalization, exports, timers) to prevent scope overlap. ✅ 2024-02-13 — Limit F8 scope to lock/unlock and timer controls; defer normalization/export toggles. ↗️ See [Master PRD — F8](masterPRD.md#f8--admin-console-responsive-p0) decision & [Feature PRD — Decisions & Rationale](featurePRD_F8.md#decisions--rationale).

## Implementation Tasks
- [x] (Owner: Codex Agent | Due: 2024-02-26) Scaffold `/admin` route with RBAC guard, event context provider, and responsive layout shell. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F8.md#architecture--flow-overview).
  - ✅ 2024-08-21 — Added `ProtectedRoute` with permissions hook, `AdminEventProvider`, and responsive admin layout shell seeded with realtime/timer placeholders and fallback messaging.
- [ ] (Owner: Backend | Due: 2024-02-22) Provide aggregated progress view/table and timer state schema updates, plus RPCs for unlock/timer/lock actions. ↗️ See [Dev Plan — Backend & Migrations](devplan_F8.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-27) Implement `useAdminConsoleData` hook, realtime subscriptions, and optimistic state handling. ↗️ See [Dev Plan — Data & State Management](devplan_F8.md#data--state-management) & [API & Integration Design](devplan_F8.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-28) Build UI components (`ProgressGrid`, `ProgressList`, `AdminControlBar`, `UnlockQueueDrawer`, `TimerCard`) with responsive behaviors and accessibility instrumentation. ↗️ See [Dev Plan — UI States & UX Messaging](devplan_F8.md#ui-states--ux-messaging) & [Feature PRD — Acceptance Criteria](featurePRD_F8.md#acceptance-criteria).
- [ ] (Owner: Codex Agent | Due: 2024-02-29) Integrate admin actions (unlock approvals, timer controls, event lock) with Supabase RPCs and provide toasts/error handling. ↗️ See [Dev Plan — Validation & Error Handling](devplan_F8.md#validation--error-handling).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-02-29) Add unit/integration tests covering RBAC, realtime fallback, and optimistic updates for admin actions. ↗️ See [Dev Plan — Testing Strategy](devplan_F8.md#testing-strategy).
- [ ] (Owner: QA | Due: 2024-03-01) Run accessibility and responsive audits across tablet/phone breakpoints, including Lighthouse/Pa11y reports. ↗️ See [Dev Plan — Testing Strategy](devplan_F8.md#testing-strategy) & [Feature PRD — Acceptance Criteria](featurePRD_F8.md#acceptance-criteria).
- [ ] (Owner: QA | Due: 2024-03-01) Validate offline/read-only states and recovery messaging using simulated network drops. ↗️ See [Dev Plan — Validation & Error Handling](devplan_F8.md#validation--error-handling).

## Follow-ups
- [ ] (Owner: Security | Due: 2024-03-02) Review RLS and RPC implementations for admin console, documenting audit requirements. ↗️ See [Dev Plan — Backend & Migrations](devplan_F8.md#backend--migrations) & [Open Items & Follow-ups](devplan_F8.md#open-items--follow-ups).
- [ ] (Owner: Analytics | Due: 2024-03-05) Instrument telemetry events (`unlock_approved`, `timer_started`, `event_locked`) and align dashboards with success metrics. ↗️ See [Dev Plan — API & Integration Design](devplan_F8.md#api--integration-design) & [Feature PRD — Success Metrics](featurePRD_F8.md#success-metrics).
