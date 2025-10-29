---
owner: Codex Agent
status: not_started
last_reviewed: 2024-02-14
---

# TODO — F10 Normalization & Drop Extremes

## Clarifications & Inputs
- [ ] (Owner: Product | Due: 2024-02-15) Resolve Master PRD TODO confirming normalization formula and weighting order. ↗️ See [Master PRD — F10](masterPRD.md#f10--normalization--drop-extremes-p1) & [Feature PRD — Open Questions](featurePRD_F10.md#open-questions).
- [ ] (Owner: ScoringOps | Due: 2024-02-18) Provide policy guidance for drop-extreme eligibility (backup judges, quorum handling). ↗️ See [Master PRD — F10](masterPRD.md#f10--normalization--drop-extremes-p1) & [Feature PRD — Open Questions](featurePRD_F10.md#open-questions).

## Implementation Tasks
- [ ] (Owner: Backend | Due: 2024-02-28) Ship Supabase migrations for adjustment state, audit logs, normalized standings, and supporting SQL functions. ↗️ See [Dev Plan — Backend & Migrations](devplan_F10.md#backend--migrations).
- [ ] (Owner: Backend | Due: 2024-02-29) Implement realtime channel broadcasting and triggers for adjustment state changes. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F10.md#architecture--flow-overview).
- [ ] (Owner: Codex Agent | Due: 2024-03-01) Add API helpers and `useAdjustmentState` hook with optimistic toggles and caching. ↗️ See [Dev Plan — Data & State Management](devplan_F10.md#data--state-management) & [API & Integration Design](devplan_F10.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-03-02) Build admin adjustments panel components (`AdjustmentToggleCard`, `AdjustmentImpactList`) and wire into `/admin`. ↗️ See [Dev Plan — UI & UX Implementation](devplan_F10.md#ui--ux-implementation) & [Feature PRD — Acceptance Criteria](featurePRD_F10.md#acceptance-criteria).
- [ ] (Owner: Codex Agent | Due: 2024-03-03) Implement judge-facing normalization banner and explainer sheet with offline resilience. ↗️ See [Dev Plan — UI & UX Implementation](devplan_F10.md#ui--ux-implementation) & [Data & State Management](devplan_F10.md#data--state-management).
- [ ] (Owner: Codex Agent | Due: 2024-03-04) Update exports pipeline to request and annotate normalized data modes. ↗️ See [Dev Plan — API & Integration Design](devplan_F10.md#api--integration-design) & [Feature PRD — Acceptance Criteria](featurePRD_F10.md#acceptance-criteria).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-03-05) Write unit/integration tests for normalization algorithms, Supabase functions, and adjustment hooks. ↗️ See [Dev Plan — Testing Strategy](devplan_F10.md#testing-strategy).
- [ ] (Owner: QA | Due: 2024-03-06) Execute end-to-end rehearsal scenario validating toggles, ranking updates, judge messaging, and exports. ↗️ See [Dev Plan — Testing Strategy](devplan_F10.md#testing-strategy) & [Feature PRD — Acceptance Criteria](featurePRD_F10.md#acceptance-criteria).
- [ ] (Owner: QA | Due: 2024-03-06) Run performance benchmarks to confirm recalculation latency ≤2s and document findings. ↗️ See [Dev Plan — Testing Strategy](devplan_F10.md#testing-strategy) & [Success Metrics](featurePRD_F10.md#success-metrics).

## Follow-ups
- [ ] (Owner: Security | Due: 2024-03-05) Review RLS and audit logging for adjustment controls, ensuring compliance with governance requirements. ↗️ See [Dev Plan — Backend & Migrations](devplan_F10.md#backend--migrations) & [Risks & Mitigations](devplan_F10.md#risks--mitigations).
- [ ] (Owner: Ops | Due: 2024-03-07) Update runbooks and judge FAQ to reflect normalization workflow and escalation paths. ↗️ See [Dev Plan — Rollout & Monitoring](devplan_F10.md#rollout--monitoring) & [Feature PRD — Overview & Story](featurePRD_F10.md#overview--story).
- [ ] (Owner: Analytics | Due: 2024-03-08) Add telemetry dashboards tracking toggle usage, recalculation durations, and error rates. ↗️ See [Dev Plan — Rollout & Monitoring](devplan_F10.md#rollout--monitoring) & [Success Metrics](featurePRD_F10.md#success-metrics).
