---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-12
---

# Dev Plan — F6 Submit & Locking (+ Unlock Requests)

## Architecture & Flow Overview
- Extend the scoring route (`src/routes/score/`) sticky submit bar to orchestrate submit state, lock transitions, and unlock affordances while preserving the autosave context from F4.
- Introduce a `SubmissionController` component responsible for deriving `isSubmittable`, handling submit mutations, and driving toast notifications.
- After successful submission, transition local form providers into read-only mode by emitting a `ballotLocked` event consumed by child components (sliders, comments) to disable inputs.
- Expose an "Unlock" button that opens a bottom sheet component with reason input and request status; keep it hidden until a ballot is locked.
- Subscribe to Supabase realtime changes on the ballot record and unlock request table to refresh local state when admins approve or reject.

## Data & State Management
- Extend the scoring context with fields `submitStatus` (`idle | submitting | success | error`) and `lockState` (object with `lockedAt`, `pendingUnlockRequestId`).
- Store unlock requests locally in a queue structure similar to autosave drafts so requests can be created offline and retried when back online, including optional notes when provided.
- Use a derived selector `isSubmitDisabled` that checks pending autosave flushes, network status, and whether required sliders/comments are filled per F3/F5 rules.
- Maintain `unlockRequestDraft` state containing `reason`, `status`, and `error` to render within the bottom sheet even when offline.
- Ensure state resets appropriately when navigating between teams, using ballot IDs as keys to avoid cross-contamination.

## Backend & Migrations
- Create Supabase migration introducing `ballot_unlock_requests` table with columns: `id` (uuid), `ballot_id`, `judge_id`, `event_id`, `reason` (text, nullable), `status` (`pending|approved|rejected`), `created_at`, `resolved_at`, `resolved_by`.
- Update RLS policies to allow judges to insert rows for their ballots and read their own requests; admins can read/update all requests.
- Extend existing `ballot_audit` table to include new action types (`submitted`, `unlock_requested`, `unlock_approved`, `unlock_rejected`, `unlock_revoked`) with metadata JSON.
- Add Supabase function `submit_ballot` enforcing idempotency (upsert on ballot with lock) and writing to audit table; ensure it respects offline sync by returning consistent responses when the same payload is retried.
- Provide Supabase trigger or RPC `request_unlock` that creates unlock request rows and writes audit metadata in one transaction.

## API & Integration Design
- Add `submitBallot` and `requestUnlock` functions to `src/lib/api.ts`, leveraging Supabase RPCs and returning typed responses with lock timestamps and statuses.
- Update the autosave flush logic to recognize `lockedAt` in responses and halt further autosave attempts for that ballot until unlocked.
- Implement realtime subscription helpers in `src/lib/realtime.ts` (or equivalent) to listen for changes to `ballots.locked_at` and `ballot_unlock_requests.status` for the active judge.
- Define discriminated union types for submission and unlock responses in `src/types/score.ts` to ensure UI consumers handle success, pending, and error states explicitly.
- Ensure admin-specific APIs (F8) expose unlock request lists and allow status updates; stub integration points if F8 is pending but document contract expectations.

## UI States & UX Messaging
- Build a `SubmitButton` component using Shadcn `Button` variant that supports `loading`, `success`, and `error` visuals, plus `aria-live="polite"` for status text.
- Design a `UnlockRequestSheet` component (using Shadcn `Sheet`) with reason textarea, helper text, and submission controls; include inline badges for `pending`, `approved`, `rejected` states.
- Display a persistent banner beneath the team header when a request is pending approval, including last updated timestamp and reminding judges they can add optional context while waiting.
- Show toasts for submission success/failure and unlock request updates using the shared toast context; include actionable copy for retries.
- Respect safe-area insets when rendering bottom sheet and sticky submit bar to avoid overlapping OS gestures.

## Validation & Error Handling
- Disable submit when any slider values are missing or autosave queue indicates unsynced drafts older than 2 seconds (ensuring latest data is persisted).
- Handle Supabase RPC errors by mapping known codes: `BALL0CKED` (already locked), `RATE_LIMIT`, generic 500; show tailored messages.
- When offline, enqueue submission payload in autosave queue with a `finalize` flag so the sync worker attempts server submission once online.
- Trim unlock request notes before sending and allow empty submissions; when text is provided, enforce an upper character limit (e.g., 280) and surface helper text encouraging meaningful context.
- Provide recovery path for rejected unlock requests by allowing judges to submit a new request once the previous one is resolved.

## Testing Strategy
- Unit tests for submission controller hooks covering state transitions, disablement logic, and idempotent retry handling.
- Integration tests simulating a full submit flow with mocked Supabase responses ensuring UI locks appropriately and toasts fire.
- Offline tests verifying queued submissions unlock once connectivity returns and no duplicate API calls occur.
- UI tests for unlock request sheet validating validation rules, pending state, and realtime update handling.
- Accessibility checks confirming button focus order, sheet announcements, and toast `aria-live` behavior meet WCAG 2.1 AA.

## Risks & Mitigations
- **Risk:** Supabase realtime latency causing stale lock state in UI.
  - *Mitigation:* Add polling fallback every 15 seconds and manual refresh CTA when discrepancy detected.
- **Risk:** Unlock queue conflicts if admins resolve requests while judge offline.
  - *Mitigation:* Store server-side status and reconcile upon reconnect, showing resolution summary toast on resume.
- **Risk:** Complexity of offline final submission may delay implementation.
  - *Mitigation:* Leverage existing autosave queue infrastructure, adding a dedicated finalize job and thorough integration tests before launch.

## Open Items & Follow-ups
- Align with backend team on audit schema updates and RPC contract timeline; document confirmed endpoints once available.
- Partner with F8 owners to ensure admin console surfaces unlock requests using the API contracts defined above.
