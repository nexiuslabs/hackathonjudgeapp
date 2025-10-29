---
owner: Codex Agent
status: in_progress
last_reviewed: 2025-02-14
---

# TODO — F2 Brief (Mobile Nav + Anchors)

## Clarifications & Inputs
- [x] (Owner: Codex Agent | Completed: 2024-02-06) Confirmed Supabase-managed content source for hero/overview/CTA copy per Master PRD decision (2024-02-06) with offline prefetch requirement. ↗️ See [Master PRD — F2 Decisions](masterPRD.md#f2--brief-mobile-nav--anchors-p0) & [Feature PRD — Decisions](featurePRD_F2.md#decisions-resolved-from-open-questions).
- [x] (Owner: Codex Agent | Completed: 2024-02-06) Validated roster data strategy using Supabase views with background refetch + manual refresh, persisting offline cache. ↗️ See [Master PRD — F2 Decisions](masterPRD.md#f2--brief-mobile-nav--anchors-p0) & [Feature PRD — Decisions](featurePRD_F2.md#decisions-resolved-from-open-questions).

## Implementation Tasks
- [x] (Owner: Codex Agent | Completed: 2024-02-07) Scaffolded `/brief` route structure with hero, modular section components, and sticky anchor navigation wired to URL hashes. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F2.md#architecture--flow-overview) & [UI Components & UX Details](devplan_F2.md#ui-components--ux-details).
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Implement Supabase data fetchers and offline cache strategy for brief content, judges, and finalists. *(Pending — UI currently relies on `offlineBriefSnapshot`; need API wiring and cache persistence.)* ↗️ See [Dev Plan — Data & State Management](devplan_F2.md#data--state-management) & [API & Integration Design](devplan_F2.md#api--integration-design).
- [x] (Owner: Codex Agent | Due: 2024-02-21) Add Supabase schema updates (tables/views + RLS) supporting brief content and rosters. *(Completed — Codex Agent, 2025-02-14: Added `brief_content`, `teams`, and `judges` tables plus finalist/judge views and RLS via migration `20251029095435_create_brief_content_and_views.sql`.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F2.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Build loading, empty, error, and offline states for roster and content sections with telemetry hooks. *(In progress — base sections scaffolded, but dynamic states pending Supabase integration.)* ↗️ See [Dev Plan — UI Components & UX Details](devplan_F2.md#ui-components--ux-details) & [Data & State Management](devplan_F2.md#data--state-management).
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Develop automated tests (unit, component, integration, visual regression) covering anchors, accordions, and data flows. *(Not started — awaiting data-layer implementation to stabilise UI states.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F2.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Align analytics events and monitoring with Feature F14 once instrumentation plan is ready. *(Pending — no analytics schema defined yet.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F2.md#open-items--follow-ups).
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Confirm illustration assets and branding details with design team for hero/empty states. *(Pending design handoff; using placeholder content.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F2.md#open-items--follow-ups).
