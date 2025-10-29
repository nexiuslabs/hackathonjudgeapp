---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-04
---

# TODO — F2 Brief (Mobile Nav + Anchors)

## Clarifications & Inputs
- [x] (Owner: Codex Agent | Completed: 2024-02-06) Confirmed Supabase-managed content source for hero/overview/CTA copy per Master PRD decision (2024-02-06) with offline prefetch requirement. ↗️ See [Master PRD — F2 Decisions](masterPRD.md#f2--brief-mobile-nav--anchors-p0) & [Feature PRD — Decisions](featurePRD_F2.md#decisions-resolved-from-open-questions).
- [x] (Owner: Codex Agent | Completed: 2024-02-06) Validated roster data strategy using Supabase views with background refetch + manual refresh, persisting offline cache. ↗️ See [Master PRD — F2 Decisions](masterPRD.md#f2--brief-mobile-nav--anchors-p0) & [Feature PRD — Decisions](featurePRD_F2.md#decisions-resolved-from-open-questions).

## Implementation Tasks
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Scaffold `/brief` route structure with section components and sticky anchor nav. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F2.md#architecture--flow-overview) & [UI Components & UX Details](devplan_F2.md#ui-components--ux-details).
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Implement Supabase data fetchers and offline cache strategy for brief content, judges, and finalists. ↗️ See [Dev Plan — Data & State Management](devplan_F2.md#data--state-management) & [API & Integration Design](devplan_F2.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Add Supabase schema updates (tables/views + RLS) supporting brief content and rosters. ↗️ See [Dev Plan — Backend & Migrations](devplan_F2.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Build loading, empty, error, and offline states for roster and content sections with telemetry hooks. ↗️ See [Dev Plan — UI Components & UX Details](devplan_F2.md#ui-components--ux-details) & [Data & State Management](devplan_F2.md#data--state-management).
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Develop automated tests (unit, component, integration, visual regression) covering anchors, accordions, and data flows. ↗️ See [Dev Plan — Testing Strategy](devplan_F2.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Align analytics events and monitoring with Feature F14 once instrumentation plan is ready. ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F2.md#open-items--follow-ups).
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Confirm illustration assets and branding details with design team for hero/empty states. ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F2.md#open-items--follow-ups).
