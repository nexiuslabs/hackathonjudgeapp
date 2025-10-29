---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-11
---

# TODO — F5 Comments (Strength & Improvement)

## Clarifications & Inputs
- [x] (Owner: Product | Due: 2024-02-15) Confirm Supabase storage shape for the two comment fields (`comment_strength`, `comment_improvement` vs combined payload). ✅ Decided to create dedicated columns per Master PRD decision (2024-02-11).
- [x] (Owner: UX | Due: 2024-02-15) Provide final helper text/placeholder copy and tone guidance for Strength/Improvement inputs. ✅ UX to manage copy via Supabase content tables per Master PRD decision (2024-02-11); track publication in implementation tasks.

## Implementation Tasks
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Implement Supabase migration adding nullable `comment_strength` and `comment_improvement` columns (text, 1000 char limit) with updated RLS policies. ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-18) Regenerate Supabase types and update `src/types` definitions to include new comment fields. ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-19) Build `CommentField` component and integrate Strength/Improvement inputs into the scoring page with autosave wiring. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F5.md#architecture--flow-overview) & [UI States & UX Messaging](devplan_F5.md#ui-states--ux-messaging).
- [ ] (Owner: Codex Agent | Due: 2024-02-19) Extend autosave payloads and submission mutations to persist comment values, including `useCommentFields` hook implementation. ↗️ See [Dev Plan — Data & State Management](devplan_F5.md#data--state-management) & [API & Integration Design](devplan_F5.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Implement character counter, validation, and accessibility attributes (labels, `aria-describedby`, live counter announcements). ↗️ See [Dev Plan — Validation & Error Handling](devplan_F5.md#validation--error-handling).
- [ ] (Owner: Codex Agent | Due: 2024-02-20) Handle read-only state after submission/unlock flows ensuring hydration from autosave/Supabase. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F5.md#architecture--flow-overview).

## Testing & QA
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Add unit tests for `useCommentFields` and autosave integration covering trimming, max length, and counter logic. ↗️ See [Dev Plan — Testing Strategy](devplan_F5.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Execute mobile viewport accessibility and keyboard interaction tests ensuring stable layout and announcements. ↗️ See [Dev Plan — Testing Strategy](devplan_F5.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-21) Validate Supabase migration locally, regenerate types, and run regression suite (`pnpm lint`, `pnpm test`, `pnpm typecheck`). ↗️ See [Dev Plan — Backend & Migrations](devplan_F5.md#backend--migrations) & [Testing Strategy](devplan_F5.md#testing-strategy).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-22) Coordinate with F8 and F12 owners to surface comment fields in admin console views and exports. ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F5.md#open-items--follow-ups).
- [ ] (Owner: Analytics | Due: 2024-02-22) Decide on telemetry events for comment usage (`comment_added`, `comment_modified`) and document schema. ↗️ See [Dev Plan — Open Items & Follow-ups](devplan_F5.md#open-items--follow-ups).
