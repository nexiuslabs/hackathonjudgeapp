---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-09
---

# Feature PRD — F4 Autosave & Offline Queue

## Overview & Story
Judges must be confident that their in-progress scores are preserved even when venue connectivity drops. Feature F4 introduces an autosave pipeline that safely stages partial ballots locally, syncs them to Supabase once the network stabilizes, and keeps judges informed about queue status without disrupting the scoring flow. The solution must integrate tightly with the existing scoring UI (F3) and upcoming submission and locking mechanics (F6), providing resilience against spotty Wi-Fi, device switching, and accidental app closures.

## Goals & Non-Goals
- **Goals**
  - Persist every scoring interaction to a durable local queue within 300ms of change and flush entries automatically when online.
  - Detect offline/online transitions reliably, surface unobtrusive banners/toasts, and expose queue status to the sticky submit bar.
  - Ensure queued payloads deduplicate per judge/team pairing so the latest changes always supersede prior drafts.
  - Provide retry logic with exponential backoff and conflict resolution aligned with Supabase constraints.
- **Non-Goals**
  - Final submission locking, unlock requests, or audit logging flows (handled in F6/F13).
  - Qualitative comment capture UX (F5) beyond ensuring payload schema compatibility.
  - Comprehensive analytics dashboards (F14), though lightweight instrumentation hooks should be prepared.

## User Stories
1. **Judge — unstable network:** As a judge in a weak Wi-Fi zone, I want my score changes to autosave locally and sync later so I never lose work.
2. **Judge — returning online:** As a judge who just regained connectivity, I want the app to sync my pending scores automatically and confirm success without extra taps.
3. **Head Judge/Ops:** As an ops lead monitoring readiness, I need visibility into whether judges have pending unsynced scores to coordinate troubleshooting before final submission.
4. **Accessibility reviewer:** As an accessibility lead, I need offline banners and status messages to be perceivable via assistive technologies.

## Acceptance Criteria
1. Score changes enqueue within 300ms using a resilient local storage layer (fallback to IndexedDB when available, localStorage otherwise) keyed by `event_id`, `judge_id`, and `team_id`.
2. Connectivity detection updates within 1s of a network change, triggering visible yet non-blocking offline/online banners and accessible live-region announcements.
3. Queue flush attempts run immediately upon regaining connectivity and continue with exponential backoff (configurable) until Supabase acknowledges receipt or a terminal error is surfaced.
4. Duplicate entries for the same judge/team replace prior payloads rather than appending, preserving only the most recent state.
5. Autosave integrates with the scoring UI sticky bar to show status badges (`Saved`, `Syncing`, `Offline`, `Error`) and provides actionable messaging for failures.
6. Error scenarios (e.g., Supabase 500, auth expiration) display contextual guidance and allow manual retry without data loss.
7. Telemetry records autosave events (`autosave_queued`, `autosave_flush_success`, `autosave_flush_error`) with payload size metadata for later analysis.

## Dependencies
- Feature F3 for the scoring UI inputs emitting change events.
- Feature F6 for final submission APIs that autosave must coordinate with to avoid conflicts.
- Master PRD decisions clarifying queue limits and retry parameters (see Open Questions — Resolved).
- Supabase tables/functions accepting autosave payloads (likely staging table or upsert RPC).

## Open Questions — Resolved
1. **Local queue storage constraints:** Adopt Option A by capping the queue at 50 ballots per judge/event, pruning the oldest pending entry once the cap is exceeded, and instrument telemetry to monitor cap hits. All payloads are encrypted at rest using a session-scoped AES-GCM key so shared devices do not leak scores while offline.

2. **Retry & backoff policy:** Adopt Option A with exponential backoff starting at 2s and doubling with jitter up to 60s, keeping retries active while the app is open. The sticky submit bar will surface a manual retry control whenever the backoff ceiling is reached or errors persist.

## Decisions & Rationale
1. **Storage abstraction:** Implement a storage service that prefers IndexedDB (via `idb-keyval` or custom wrapper) for structured queue management with fallback to localStorage, ensuring compatibility with Supabase Edge runtime expectations when serializing payloads.
2. **Queue item schema:** Standardize on an envelope containing metadata (`event_id`, `judge_id`, `team_id`, `updated_at`, `version`) plus the partial score payload to simplify deduplication and conflict resolution.
3. **Connectivity hook:** Provide a reusable `useConnectivity` hook that leverages browser online/offline events plus periodic heartbeat checks to Supabase to reduce false positives.
4. **Queue capacity monitoring:** Emit telemetry counters for queue cap breaches and storage encryption failures so ops can spot trends before finals day.
5. **Retry UX integration:** Surface manual retry controls and countdown messaging in the sticky submit bar once the exponential backoff max interval is reached.

## Risks & Mitigations
- **Risk:** Local storage exposure on shared devices could leak scores.
  - *Mitigation:* Encrypt cached payloads with session-scoped AES-GCM keys rotated with Supabase session refresh, and wipe storage when judges sign out or magic-link sessions expire.
- **Risk:** Autosave conflicts with final submission causing duplicate writes.
  - *Mitigation:* Coordinate with F6 to detect locked ballots and skip autosave flush once submission confirmed; add conflict resolution logic.
- **Risk:** Banner fatigue or clutter reduces usability.
  - *Mitigation:* Use concise copy, allow dismissal for success banners, and ensure states integrate into sticky bar rather than persistent overlays.

## Success Metrics
- ≥99.5% of autosave flush attempts succeed within 30s of regaining connectivity during pilot testing.
- Zero incidents of data loss reported during finals dry runs.
- Offline banner accessibility checks achieve WCAG 2.1 AA (screen reader announcements confirmed).
- Telemetry shows <5% of sessions hitting queue capacity limits once finalized.
