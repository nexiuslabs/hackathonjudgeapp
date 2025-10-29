---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-08-24
---

# TODO — F3 Judge Scoring UI (Sliders 1–10)

## Clarifications & Inputs
- [x] (Owner: Product | Completed: 2024-02-07) Adopt judging brief Supabase content as the single source for criterion labels and helper copy. ↗️ See [Master PRD decision](masterPRD.md#f3--judge-scoring-ui-p0).
- [x] (Owner: ScoringOps | Completed: 2024-02-07) Align total preview with official per-criterion weights supplied by ScoringOps. ↗️ See [Master PRD decision](masterPRD.md#f3--judge-scoring-ui-p0).
- [x] (Owner: ExperienceDesign | Completed: 2024-02-07) Require explicit first interaction before sliders record values to prevent accidental defaults. ↗️ See [Master PRD decision](masterPRD.md#f3--judge-scoring-ui-p0).

## Implementation Tasks
- [x] (Owner: Codex Agent | Due: 2024-02-22) Scaffold `/score` route container and component structure (`ScorePage`, `ScoreCriteriaList`, `ScoreSliderCard`, `ScoreStickyBar`). *(Completed — Codex Agent, 2024-02-08: Established responsive layout, onboarding banner, slider list, and sticky action bar shell.)* ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F3.md#architecture--flow-overview) & [UI Components & UX Details](devplan_F3.md#ui-components--ux-details).
- [x] (Owner: Codex Agent | Due: 2024-02-23) Implement scoring criteria data fetching hook (`useScoringCriteria`) with offline caching and weighting-aware total calculation helper. *(Completed — Codex Agent, 2024-02-08: Added Supabase-backed loader with localStorage caching, fallback snapshot, and weighted total helper with unit tests.)* ↗️ See [Dev Plan — Data & State Management](devplan_F3.md#data--state-management) & [API & Integration Design](devplan_F3.md#api--integration-design).
- [x] (Owner: Codex Agent | Due: 2024-02-23) Integrate validation logic, accessibility features, and sticky bar status states covering ready, incomplete, offline, and pending scenarios. *(Completed — Codex Agent, 2024-02-08: Delivered validation state machine, acknowledgement messaging, offline callouts, and keyboard-friendly slider controls.)* ↗️ See [Dev Plan — Data & State Management](devplan_F3.md#data--state-management) & [UI Components & UX Details](devplan_F3.md#ui-components--ux-details).
- [ ] (Owner: Codex Agent | Due: 2024-02-26) Coordinate Supabase schema updates for `scoring_criteria` metadata and score submission interface placeholders with RLS review. ↗️ See [Dev Plan — Backend & Migrations](devplan_F3.md#backend--migrations).

## Testing & QA
- [x] (Owner: Codex Agent | Due: 2024-02-26) Add unit, component, and integration tests per strategy. *(Completed — Codex Agent, 2024-08-24: Added `score-page`, `scoring-utils`, and comment draft coverage exercising validation, totals, and lifecycle messaging.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F3.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-26) Run accessibility and visual regression audits for scoring surfaces. *(Pending — need Lighthouse/Storybook workflow configured.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F3.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-27) Sync with Feature F4 team on autosave payload structure and queue identifiers for scoring form integration. *(In progress — awaiting F4 hook implementation to finalise payload contract.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F3.md#open-items--follow-ups).
- [ ] (Owner: Codex Agent | Due: 2024-02-27) Align with design on final spacing/iconography and publish Storybook entries for scoring components. *(Pending — Storybook instance not yet set up in repo.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F3.md#open-items--follow-ups).
