---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-09
---

# Dev Plan — F4 Autosave & Offline Queue

## Architecture & Flow Overview
- Introduce an autosave service module (`src/lib/autosave/`) exposing hooks and utilities consumed by the scoring UI and future features requiring offline queueing.
- Core flow: scoring UI dispatches change events → autosave hook debounces input → payload persisted to local queue → connectivity watcher triggers flush when online → Supabase upsert API acknowledges → queue item cleared and status emitted back to UI.
- Implement a global context provider (`AutosaveProvider`) that shares connectivity state, queue counts, and latest sync status to consumers like the sticky submit bar and offline banners.

## Data & State Management
- Represent queue items as records containing metadata (`eventId`, `judgeId`, `teamId`, `updatedAt`, `payloadVersion`) and `scores` object; include optional `comments` field for F5 compatibility.
- Use IndexedDB via a small wrapper (`createQueueStore`) with fallbacks to localStorage when IndexedDB is unavailable; encrypt payloads at rest using a session-scoped AES-GCM key derived from the active Supabase session and rotate it whenever the session refreshes.
- Maintain in-memory mirrors of queue metadata for fast UI updates while persisting full payloads to storage; use React Query or Zustand store for subscription-based updates.
- Deduplicate queue entries by generating deterministic keys (`${eventId}:${judgeId}:${teamId}`) and overwriting on enqueue while enforcing a max queue size of 50 items per judge/event; prune the oldest pending entry whenever the cap would be exceeded and emit a telemetry event.
- Expose selectors for queue length, pending sync count, last sync timestamp, and error state for analytics and UI.

## Backend & Migrations
- Coordinate with backend owners to define a Supabase RPC or REST endpoint (`POST /autosave`) that accepts partial ballot payloads and performs upsert into a staging table (`autosave_ballots`).
- Ensure Supabase schema includes columns for metadata (`event_id`, `judge_id`, `team_id`, `payload`, `updated_at`) with RLS limiting access to the owning judge and event.
- Align with future F6 submission workflow so autosave entries transition seamlessly into final submissions or are invalidated once locked.
- Plan for migration scripts that create the `autosave_ballots` table and necessary indexes (`(event_id, judge_id, team_id)`).

## API & Integration Design
- Extend `src/lib/api.ts` with:
  - `upsertAutosaveDraft(payload: AutosaveDraft): Promise<void>` calling Supabase RPC/upsert.
  - `fetchAutosaveDraft(eventId, teamId): Promise<AutosaveDraft | null>` for device switching scenarios (optional stretch if timeline allows).
- Create hook `useAutosaveQueue({ eventId, judgeId, teamId, payload })` that:
  - Debounces inbound payloads (300ms) before enqueueing.
  - Emits status updates (`idle`, `queued`, `syncing`, `error`) for UI consumption.
  - Provides manual `flush()` and `clear()` methods for integration with submission flows.
- Build `useConnectivity` hook leveraging `navigator.onLine`, `online/offline` events, and periodic Supabase heartbeat (HEAD request) to verify reachability.
- Integrate exponential backoff retry logic (start 2s, double with jitter to 60s) into the queue flush loop, surfacing countdown/state via the autosave context and exposing a manual `flush()` trigger once the ceiling is hit.
- Define TypeScript types (`AutosaveDraft`, `AutosaveQueueItem`, `AutosaveStatus`) in `src/types/autosave.ts` and ensure parity with Supabase types.

## UI States & UX Messaging
- Design reusable `ConnectivityBanner` component in `src/components/system/` that listens to autosave context and renders offline/online/sync error messages with accessible ARIA live regions.
- Extend `ScoreStickyBar` (F3) to subscribe to autosave status and display inline badges, pending counts, and manual retry CTA when errors persist.
- Provide toasts for transitions: `Offline mode`, `All changes saved`, `Sync failed — tap to retry` with appropriate icons and semantics, including countdown copy when exponential backoff is active.
- Ensure banners respect safe areas, allow dismissal after success, and avoid covering primary actions.

## Testing Strategy
- Unit tests for queue storage abstraction verifying enqueue, dedupe, persistence fallback, and recovery after reload.
- Integration tests using mocked IndexedDB/localStorage verifying end-to-end flow from scoring change to Supabase API call with retry/backoff logic (mock fetch).
- Connectivity simulation tests toggling `navigator.onLine` and heartbeat responses to validate banner messaging and hook responses.
- Accessibility tests ensuring banners use `role="status"` or `aria-live="polite"` appropriately and are keyboard dismissible when applicable.
- Performance benchmarks to confirm enqueue operations stay below 300ms and flush loops handle batch sizes efficiently.

## Risks & Mitigations
- **Risk:** Browser storage quota exceeded leading to failed enqueues.
  - *Mitigation:* Enforce the 50-item cap with telemetry for prune events, warn judges through the sticky bar when approaching the cap, and document remediation steps in runbooks.
- **Risk:** Supabase authentication expiry prevents flush.
  - *Mitigation:* Detect 401/403 responses, trigger silent session refresh via Supabase client, and notify user if re-authentication required.
- **Risk:** Complexity of shared autosave service slows development across features.
  - *Mitigation:* Deliver minimal viable abstraction first focused on scoring use case, with extension points documented for future features.

## Open Items & Follow-ups
- Partner with F6 owners to define final submission handoff, including clearing autosave entries post-submit.
- Coordinate with analytics (F14) for event taxonomy to avoid duplicate instrumentation later.
- Capture autosave-specific telemetry schema (queue cap hits, encryption failures, retry countdown states) ahead of analytics implementation.
