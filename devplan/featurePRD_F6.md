---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-12
---

# Feature PRD — F6 Submit & Locking (+ Unlock Requests)

## Overview & Story
Judges must be able to confidently finalize a ballot once their scoring and comments are ready, while still having a lightweight path to request changes if they spot an error. Feature F6 builds the definitive "Submit" experience for the scoring flow, ensuring submissions are idempotent, clearly acknowledged, and immediately lock the ballot to prevent accidental edits. When corrections are needed, judges can raise an unlock request that routes to admins without leaving the scoring context. The flow must respect offline/autosave behavior defined in F4 and integrate tightly with the audit requirements highlighted in the master PRD.

## Goals & Non-Goals
- **Goals**
  - Deliver an unmistakable submit interaction that prevents duplicate posts, surfaces real-time status, and locks the ballot after success.
  - Provide a mobile-first unlock request sheet that captures context for admins and tracks request state.
  - Ensure submission and locking integrate with autosave drafts, comments (F5), and downstream admin tooling (F8).
  - Record all submit, lock, unlock, and rejection events in the audit log for compliance and troubleshooting.
- **Non-Goals**
  - Building a full dispute resolution workflow or chat between judges and admins.
  - Implementing push notifications or SMS for unlock outcomes (handled within admin console scope).
  - Introducing alternative submission channels beyond the core scoring UI.

## User Stories
1. **Judge — confident finalization:** As a judge, I want a clear, single-tap submit that confirms success and locks my ballot so I know my scores are recorded once.
2. **Judge — correction needed:** As a judge who notices a mistake after submitting, I need to request an unlock with a short note so the admin team can approve the change quickly.
3. **Head Judge/Admin:** As an admin, I need to see incoming unlock requests, approve or reject them, and have the system log the decision for auditing.
4. **Ops Analyst:** As an ops teammate, I need an audit trail of submissions and unlock actions to verify fairness and resolve disputes post-event.

## Acceptance Criteria
1. Submit action is only enabled when required scoring inputs meet completion rules (per F3/F5) and remains disabled with spinner while a request is in flight to prevent double taps.
2. Successful submission returns an in-app toast/snackbar confirmation and transitions the ballot to read-only mode, preserving displayed scores and comments.
3. Failed submission surfaces actionable error messaging (offline, validation, server errors) and keeps the submit CTA enabled for retry once issues resolve.
4. Unlock request bottom sheet is accessible via a clearly labeled affordance post-submission, collecting an optional note with helper text that encourages judges to share context.
5. Unlock requests persist locally when offline and sync once connectivity returns, reflecting pending status in the UI.
6. Admin approval or rejection updates the judge UI in near-real time (realtime subscription or polling) and re-enables editing on approval.
7. All submit, lock, unlock, and admin decision events create audit records with timestamps, actor, action type, and optional reason data.
8. Accessibility: submit and unlock controls are reachable via screen reader focus order, announce status changes via `aria-live`, and maintain ≥44px tap targets.

## Dependencies
- **F3** scoring UI for placement of submit bar and state management.
- **F4** autosave/offline queue for syncing pending submissions and unlock requests.
- **F5** comments integration to ensure text fields lock/unlock with scores.
- **F8** admin console to review and act on unlock requests.
- Supabase functions/tables that enforce locking and audit logging.

## Decisions & Rationale
1. **Single mutation endpoint:** Use a dedicated `submitBallot` mutation that accepts the latest autosave payload and handles deduplication server-side via ballot UUIDs to guarantee idempotency.
2. **Client-side lock state:** Mirror the server `locked_at` timestamp in local state so the UI can immediately transition to read-only without waiting for a refetch, improving responsiveness on mobile.
3. **Unlock request entity:** Store unlock requests in a structured Supabase table (`ballot_unlock_requests`) keyed by ballot/event to enable admin filtering and audit continuity.
4. **Realtime updates:** Subscribe to Supabase realtime channels for ballot lock state and unlock decisions, falling back to interval polling when offline or if realtime is unavailable.
5. **Toast-first feedback:** Surface submission and unlock status via Shadcn toast primitives paired with inline state messaging to keep judges informed without modal interruptions.

## Risks & Mitigations
- **Risk:** Offline submissions could conflict with already-locked ballots once connectivity returns.
  - *Mitigation:* Server should check `locked_at` and return a specific error code; client handles conflict by showing resolution messaging and skipping redundant updates.
- **Risk:** Judges may submit multiple unlock requests if feedback is delayed.
  - *Mitigation:* Limit one active request per ballot and display pending status with expected response window.
- **Risk:** Audit logging gaps may exist if backend schema isn't ready.
  - *Mitigation:* Coordinate with backend team early (see TODO in master PRD) and add interim logging to Supabase edge functions if needed.
- **Risk:** Accessibility regressions from dynamic submit state changes.
  - *Mitigation:* Include screen reader announcements and maintain focus management when the bottom sheet opens or closes.

## Success Metrics
- ≥99% of submissions succeed on the first attempt during finals (tracked via telemetry).
- 0 duplicate ballot submissions recorded per event.
- Unlock request resolution median time ≤ 5 minutes once admin console support is live.
- Positive qualitative feedback from judges regarding clarity of submission status in pilot tests.

## Open Questions
1. **Unlock reason requirement:** Should judges be required to supply a reason when requesting an unlock?
   - *Option A:* Optional free-text reason to keep flow fast.
   - *Option B:* Required reason (minimum characters) to provide admins with context.
   - *Recommendation:* **Option A** — make the note optional so judges can submit quickly, while reinforcing through copy and examples why providing context speeds up admin review.
2. **Admin notification surface:** How do admins learn about new unlock requests?
   - *Option A:* Highlight pending requests within the `/admin` console list view only.
   - *Option B:* Trigger additional notifications (email, push) alongside console updates.
   - *Recommendation:* **Option A** — center the experience in the `/admin` console with prominent badges and counts, deferring cross-channel alerts until post-launch evaluation.
3. **Audit storage approach:** Should submit/lock/unlock actions append to an existing audit log or use a dedicated table?
   - *Option A:* Extend the existing `ballot_audit` table with new action types and metadata columns.
   - *Option B:* Create specialized tables for submissions and unlocks with relational joins.
   - *Recommendation:* **Option A** — extending `ballot_audit` keeps chronological history centralized and simplifies querying, provided we add structured JSON metadata for unlock notes and admin decisions.

## References
- Master PRD section [F6 — Submit & Locking](masterPRD.md#f6--submit--locking--unlock-requests-p0) and associated TODOs for UX and engineering clarifications.
- Prior features F3–F5 for scoring flow, autosave, and comments context.
