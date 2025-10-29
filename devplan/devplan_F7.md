---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-12
---

# Dev Plan — F7 Live Ranking (Gated)

## Architecture & Flow Overview
- Introduce a dedicated `RankingsRoute` mounted under `/rankings` (and linked within `/admin` and `/score` contexts) that derives role/gating state from shared auth providers.
- For admins, render the rankings content immediately after permissions check; for judges, gate the content behind a lock screen component that listens for completion signals from F6 (`allBallotsSubmitted`).
- Implement a `useRankingsFeed` hook that orchestrates realtime subscriptions to the Supabase `rankings_view`, falls back to interval polling, and exposes metadata (`lastUpdated`, `isStale`, `connectionState`).
- Cache the most recent payload in IndexedDB/local storage using existing offline helpers so we can hydrate quickly on re-entry and show cached badges while resyncing.
- Emit analytics events (`rankings_view_opened`, `rankings_unlocked`) via the telemetry layer once defined to feed success metrics tracking.

## Data & State Management
- Define a TypeScript model `RankingEntry` capturing `teamId`, `teamName`, `totalScore`, `criterionScores`, `rank`, `deltaToPrev`, and `submittedCount` fields aligned with `rankings_view` columns (pending Data clarification on metrics).
- Store feed state in a React Query cache keyed by `eventId` and user role, enabling background refetch and cache invalidation when gating transitions from locked → unlocked.
- Track gating status via a derived selector combining local judge completion (from F3/F6 contexts) and server confirmation (e.g., `rankings_unlocks` table or event metadata) to prevent client-only unlocks.
- Maintain connection health flags (`isRealtimeConnected`, `lastRealtimeEventAt`) to drive UI indicators and determine when to switch to polling mode.
- Persist cached rankings with timestamps; mark the UI with `isCached=true` when showing stored data and disable sorting interactions until fresh data arrives.

## Backend & Migrations
- Coordinate with backend to ensure `rankings_view` exposes required columns (per Master PRD TODO on displayed metrics). If missing, add Supabase migration to extend the view and update generated types via `pnpm supabase types`.
- If gating requires explicit tracking (Option A from PRD), add a Supabase table or column (e.g., `events.rankings_unlocked_at`) updated once global completion occurs, with RLS to allow admins to trigger manual overrides.
- Confirm realtime publication on `rankings_view` via Supabase replication; if not automatically supported, implement an Edge Function or materialized table that emits realtime changes when ballots finalize.
- Validate that RLS prevents judges from querying rankings before unlock; if necessary, wrap access in a Supabase function `get_rankings(event_id)` that enforces gating server-side.

## API & Integration Design
- Extend `src/lib/api.ts` with `fetchRankings(eventId)` and `subscribeRankings(eventId)` helpers returning typed payloads and unsubscribe handles.
- Introduce a `useRankingsPermissions` utility that composes existing permission hooks with gating metadata, returning `canViewNow`, `isLocked`, and `unlockEta` (if available).
- Ensure admin console routes can embed the rankings list component while passing sorting/filter props; expose callbacks for F8 to toggle between `raw` and future normalized modes.
- Provide instrumentation hooks to log fetch durations and failure reasons, feeding into the analytics success metrics once pipelines exist.

## UI States & UX Messaging
- Create reusable components: `RankingsHeader` (event selector, last updated badge), `RankingsTable` (desktop/tablet layout using Shadcn `Table`), and `RankingsCards` (mobile stack built with `Card` + `Badge`).
- Implement a `LockedRankingNotice` component for judges featuring gating explanation, progress indicator (e.g., number of judges completed), and copy aligning with fairness messaging.
- Display connection banners using existing F4 offline patterns; include CTA to retry or switch networks.
- Highlight unlocked transition with a Shadcn `Toast` and animated focus shift to the top of the rankings list while preserving accessibility (focus trap disabled once content visible).
- Support column sorting for admins on tablet/desktop; on mobile, provide filter sheet to reorder by score delta or team name.

## Validation & Error Handling
- Guard against empty datasets by rendering an informative empty state with steps to verify submissions and a link to admin diagnostics.
- Debounce realtime updates to prevent rapid re-renders; aggregate events occurring within 500ms before updating UI to maintain smooth scrolling.
- Handle Supabase errors by mapping codes to friendly copy (`permission_denied`, `not_ready`, generic network) and log details for debugging.
- When cached data is older than 15 minutes, display a warning badge prompting manual refresh and log a telemetry event for observability.
- Ensure focus returns to the triggering control after modal interactions (e.g., filter sheet) to meet accessibility guidelines.

## Testing Strategy
- Unit tests for `useRankingsFeed` verifying realtime + polling fallback behavior, cache hydration, and stale detection logic.
- Integration tests covering judge gating transitions (locked → unlocked) and admin always-on access, including RBAC enforcement.
- UI tests validating responsive layouts (table vs. cards), sorting interactions, and offline/empty/error states.
- Contract tests or schema assertions ensuring `rankings_view` columns align with TypeScript models after Supabase type generation.
- Accessibility audits (Lighthouse/Pa11y) focusing on table semantics, focus management, and toast announcements.

## Risks & Mitigations
- **Risk:** Supabase realtime may not support views directly, causing delayed updates.
  - *Mitigation:* Mirror rankings into a materialized table updated via trigger and subscribe to that table instead; document fallback in backend tasks.
- **Risk:** Gating logic may race if client unlocks before server confirmation.
  - *Mitigation:* Require both client completion signals and server unlock timestamp; render partial state only when both satisfied.
- **Risk:** Cached data may conflict with new schema changes.
  - *Mitigation:* Include schema version in cached payload keys and invalidate when version mismatches detected.

## Open Items & Follow-ups
- Align with Product/Data owners to resolve Master PRD TODOs on gating rule and displayed metrics; update PRD/dev plan once decisions recorded.
- Coordinate with F8 team to integrate rankings module into the admin console layout and ensure shared components meet their needs.
- Confirm analytics pipeline readiness for new telemetry events; file follow-up tasks if instrumentation must be deferred.
