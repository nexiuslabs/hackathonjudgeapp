---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-08-24
---

# TODO — F4 Autosave & Offline Queue

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-09) Finalized autosave queue cap at 50 items per judge/event with session-scoped AES-GCM encryption for cached payloads. ↗️ See [Master PRD — F4 Decisions](masterPRD.md#f4--autosave--offline-queue-p0).
- [x] (Owner: Engineering | Due: 2024-02-09) Locked exponential backoff policy (2s start, jittered doubling to 60s) with manual retry exposure in sticky submit bar. ↗️ See [Master PRD — F4 Decisions](masterPRD.md#f4--autosave--offline-queue-p0).

## Implementation Tasks
- [x] (Owner: Codex Agent | Due: 2024-02-15) Implement autosave storage abstraction (`createQueueStore`) with IndexedDB fallback and dedupe logic. ↗️ See [Dev Plan — Data & State Management](devplan_F4.md#data--state-management).
  - Completed — 2024-02-15: Added encrypted queue store with IndexedDB/localStorage persistence, dedupe, and cap pruning helpers.
- [ ] (Owner: Codex Agent | Due: 2024-02-15) Build `useConnectivity` and `useAutosaveQueue` hooks emitting status updates and exposing manual flush controls. *(Not started — Score page currently uses local lifecycle helpers; dedicated hooks still required.)* ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F4.md#architecture--flow-overview) & [API & Integration Design](devplan_F4.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-16) Extend `src/lib/api.ts` with Supabase autosave upsert/fetch helpers and align types in `src/types/autosave.ts`. *(Pending — frontend queue persists locally without remote sync.)* ↗️ See [Dev Plan — API & Integration Design](devplan_F4.md#api--integration-design).
- [ ] (Owner: Backend | Due: 2024-02-16) Create Supabase migration for `autosave_ballots` table and RLS policies. *(Not started — requires Supabase project updates.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F4.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-19) Integrate autosave context into scoring UI sticky bar with offline banners and toasts. *(In progress — Score page shows acknowledgement messaging via `useBallotLifecycle`, but autosave queue indicators still missing.)* ↗️ See [Dev Plan — UI States & UX Messaging](devplan_F4.md#ui-states--ux-messaging).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Add unit/integration tests for autosave queue, connectivity transitions, and retry/backoff logic. ↗️ See [Dev Plan — Testing Strategy](devplan_F4.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Run accessibility checks for banners and announcements; document results. ↗️ See [Dev Plan — Testing Strategy](devplan_F4.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Align with F6 implementation team on submission handoff and queue clearing triggers. *(Pending — needs shared contract once Supabase functions are ready.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F4.md#open-items--follow-ups).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Coordinate with analytics owners to define autosave telemetry schema covering queue cap hits, encryption failures, and retry countdown states. *(Pending — telemetry events not yet specified.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F4.md#open-items--follow-ups).
