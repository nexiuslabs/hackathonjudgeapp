---
owner: Codex Agent
status: in_progress
last_reviewed: 2024-08-24
---

# TODO — F5 Comments (Strength & Improvement)

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-15) Confirm Supabase storage shape for the two comment fields (`comment_strength`, `comment_improvement` vs combined payload). ✅ Decided to create dedicated columns per Master PRD decision (2024-02-11).
- [x] (Owner: UX | Due: 2024-02-15) Provide final helper text/placeholder copy and tone guidance for Strength/Improvement inputs. ✅ UX to manage copy via Supabase content tables per Master PRD decision (2024-02-11); track publication in implementation tasks.

## Implementation Tasks
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Implement Supabase migration adding nullable `comment_strength` and `comment_improvement` columns (text, 1000 char limit) with updated RLS policies. *(Pending — frontend integration complete; awaiting Supabase migration authoring.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Regenerate Supabase types and update `src/types` definitions to include new comment fields. *(Pending — blocked by migration above.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations).
- [x] (Owner: Codex Agent | Due: 2024-02-19) Build `CommentField` component and integrate Strength/Improvement inputs into the scoring page with autosave wiring. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F5.md#architecture--flow-overview) & [UI States & UX Messaging](devplan_F5.md#ui-states--ux-messaging). ✅ 2024-02-18: Added reusable component with autosave status badges and mounted it beneath the scoring sliders.
- [x] (Owner: Codex Agent | Due: 2024-02-19) Extend autosave payloads and submission mutations to persist comment values, including `useCommentFields` hook implementation. ↗️ See [Dev Plan — Data & State Management](devplan_F5.md#data--state-management) & [API & Integration Design](devplan_F5.md#api--integration-design). ✅ 2024-02-18: Implemented `useCommentFields` with local-storage draft syncing, submission locking, and updated autosave payload types.
- [x] (Owner: Codex Agent | Due: 2024-02-20) Implement character counter, validation, and accessibility attributes (labels, `aria-describedby`, live counter announcements). ↗️ See [Dev Plan — Validation & Error Handling](devplan_F5.md#validation--error-handling). ✅ 2024-02-18: Delivered live character counters, max-length messaging, and aria-linked status updates across the comment fields.
- [x] (Owner: Codex Agent | Due: 2024-02-20) Handle read-only state after submission/unlock flows ensuring hydration from autosave/Supabase. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F5.md#architecture--flow-overview). ✅ 2024-02-18: Locked comment fields post-submission with unlock affordance while preserving autosaved drafts.

## Testing & QA
- [x] (Owner: Codex Agent | Due: 2024-02-21) Add unit tests for `useCommentFields` and autosave integration covering trimming, max length, and counter logic. ↗️ See [Dev Plan — Testing Strategy](devplan_F5.md#testing-strategy). ✅ 2024-02-18: Added hook-level tests plus Score page coverage for autosave persistence and lock/unlock workflows.
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Execute mobile viewport accessibility and keyboard interaction tests ensuring stable layout and announcements. *(Pending — need manual QA session.)* ↗️ See [Dev Plan — Testing Strategy](devplan_F5.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Validate Supabase migration locally, regenerate types, and run regression suite (`pnpm lint`, `pnpm test`, `pnpm typecheck`). *(Blocked — migration not yet created.)* ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations) & [Testing Strategy](devplan_F5.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Coordinate with F8 and F12 owners to surface comment fields in admin console views and exports. *(Pending — waiting for backend schemas.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F5.md#open-items--follow-ups).
- [ ] (Owner: Analytics | Due: 2024-02-22) Decide on telemetry events for comment usage (`comment_added`, `comment_modified`) and document schema. *(Pending — analytics backlog not prioritised yet.)* ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F5.md#open-items--follow-ups).
