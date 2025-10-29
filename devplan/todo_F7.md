---
owner: Codex Agent
status: not_started
last_reviewed: 2024-02-12
---

# TODO — F7 Live Ranking (Gated)

## Clarifications & Inputs
- [ ] (Owner: Product | Due: 2024-02-20) Define judge-facing gating rule for releasing rankings (global vs per-judge vs manual override). ↗️ See [Master PRD — F7](masterPRD.md#f7--live-ranking-gated-p0) TODO & [Feature PRD — Open Questions](featurePRD_F7.md#open-questions).
- [ ] (Owner: Data | Due: 2024-02-20) Confirm metrics exposed by `rankings_view` (per-criterion averages, deltas, submission counts). ↗️ See [Master PRD — F7](masterPRD.md#f7--live-ranking-gated-p0) TODO & [Feature PRD — Open Questions](featurePRD_F7.md#open-questions).

## Implementation Tasks
- [ ] (Owner: Codex Agent | Due: 2024-02-26) Scaffold rankings route, permission gating, and shared components (`RankingsHeader`, `RankingsTable`, `RankingsCards`, `LockedRankingNotice`). ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F7.md#architecture--flow-overview) & [UI States & UX Messaging](devplan_F7.md#ui-states--ux-messaging).
- [ ] (Owner: Codex Agent | Due: 2024-02-26) Implement `useRankingsFeed` hook with realtime + polling fallback, caching, and stale detection metadata. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F7.md#architecture--flow-overview) & [Data & State Management](devplan_F7.md#data--state-management).
- [ ] (Owner: Backend | Due: 2024-02-22) Update Supabase `rankings_view`/supporting schema to include required columns and unlock timestamp handling. ↗️ See [Dev Plan — Backend & Migrations](devplan_F7.md#backend--migrations) & [Feature PRD — Acceptance Criteria](featurePRD_F7.md#acceptance-criteria).
- [ ] (Owner: Codex Agent | Due: 2024-02-27) Extend `src/lib/api.ts` with rankings fetch/subscribe helpers plus RBAC enforcement via protected RPC if needed. ↗️ See [Dev Plan — API & Integration Design](devplan_F7.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-28) Integrate rankings module into admin console (F8) and score app navigation, ensuring responsive layouts and accessibility copy. ↗️ See [Dev Plan — UI States & UX Messaging](devplan_F7.md#ui-states--ux-messaging) & [Feature PRD — Acceptance Criteria](featurePRD_F7.md#acceptance-criteria).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-02-29) Add unit/integration tests for gating transitions, realtime fallback, and offline states. ↗️ See [Dev Plan — Testing Strategy](devplan_F7.md#testing-strategy).
- [ ] (Owner: QA | Due: 2024-03-01) Run accessibility + responsive audits (Lighthouse/Pa11y + device matrix) on rankings views. ↗️ See [Dev Plan — Testing Strategy](devplan_F7.md#testing-strategy) & [Feature PRD — Acceptance Criteria](featurePRD_F7.md#acceptance-criteria).

## Follow-ups
- [ ] (Owner: Analytics | Due: 2024-03-01) Instrument telemetry events and dashboards for rankings engagement and freshness metrics. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F7.md#architecture--flow-overview) & [Feature PRD — Success Metrics](featurePRD_F7.md#success-metrics).
- [ ] (Owner: Codex Agent | Due: 2024-02-29) Document admin override workflow requirements (if gating decision differs) and feed insights back into Master PRD. ↗️ See [Feature PRD — Open Questions](featurePRD_F7.md#open-questions) & [Dev Plan — Open Items & Follow-ups](devplan_F7.md#open-items--follow-ups).
