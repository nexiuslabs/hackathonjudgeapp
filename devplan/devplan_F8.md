---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-13
---

# Dev Plan — F8 Admin Console (Responsive)

## Architecture & Flow Overview
- Introduce an authenticated `/admin` route protected by `ProtectedRoute`/`usePermissions`, redirecting unauthorized users with guidance back to `/score`.
- Compose the console from two primary regions: a `ProgressWorkspace` (grid/list) and a sticky `AdminControlBar` docked to the bottom on tablets/phones and side on desktops.
- Load event context (`eventId`, timer configuration, locking state) via a new `useAdminEventContext` hook that aggregates Supabase metadata and caches results via React Query.
- Implement responsive layout using CSS grid + Tailwind breakpoints (`md` as tablet baseline), switching to list mode below `md` by reusing data adapters rather than duplicating UI state.
- Support real-time updates through Supabase subscriptions to ballots, unlock requests, and event metadata; coalesce events before updating UI to avoid thrash on large judge pools.

## Data & State Management
- Define TypeScript models: `ProgressCell` (judgeId, teamId, status, lastUpdated, scoreSummary optional), `UnlockRequest`, `AdminTimerState`, and `EventLockState` aligned with Supabase schemas.
- Create selectors to aggregate judge × team statuses into both matrix and grouped list forms, ensuring consistent color/status mapping across layouts.
- Cache progress data in React Query keyed by `eventId` and include `updatedAt` metadata for stale detection; maintain an IndexedDB snapshot for offline read-only fallback per F4 patterns.
- Track pending admin actions locally (`optimisticActions`) to immediately reflect changes in UI while awaiting server confirmation, with rollback on error.
- Reuse global offline state (`useConnectivityBanner`) to disable destructive controls and label cached data, reinforcing F4 UX paradigms.

## Backend & Migrations
- Validate existing Supabase views/tables provide necessary aggregated progress; if absent, plan migrations for:
  - `event_judge_progress_view` summarizing submission states per judge/team with timestamps, plus an optional drill-in RPC that returns per-criterion detail on demand per the Master PRD status-first decision.
  - `admin_timer_state` table storing current timer mode, remaining seconds, and control owner.
  - `unlock_requests` table updates to include `handled_by`, `handled_at`, and optional notes.
- Ensure RLS rules restrict these resources to admin roles; add security tests covering misuse attempts.
- Coordinate with backend to expose RPC endpoints (`approve_unlock`, `start_timer`, `lock_event`) that encapsulate business logic and audit logging.
- After schema updates, run `pnpm supabase types` to refresh generated types and commit them alongside migrations.

## API & Integration Design
- Extend `src/lib/api.ts` with admin-specific functions: `getAdminProgress`, `subscribeAdminProgress`, `approveUnlockRequest`, `startAdminTimer`, `pauseAdminTimer`, `lockEvent`, `unlockEvent`.
- Implement a `useAdminConsoleData` hook combining progress, unlock queue, timer state, and event lock state into a cohesive view model consumed by UI components.
- Provide typed error handling utilities mapping Supabase errors to friendly toasts and enabling retries for transient failures.
- Integrate telemetry hooks (once available) to log key admin interactions (`unlock_approved`, `timer_started`, `event_locked`).

## UI States & UX Messaging
- Build reusable components with Shadcn/UI primitives:
  - `ProgressGrid` (tablet/desktop) with sticky headers, color-coded chips, and focusable cells revealing detail drawers for per-criterion context on demand.
  - `ProgressList` (mobile) grouping by team or judge with accordions; includes quick action buttons for outstanding items and respects multi-select filter state (track, cohort, status).
  - `AdminControlBar` with segmented controls for timers, unlock queue badge, lock toggle, and navigation buttons to rankings/exports.
  - `UnlockQueueDrawer` surfacing pending requests with approve/deny actions, notes, and audit trail preview.
  - `TimerCard` showing countdown, status, and last update, supporting hardware keyboard shortcuts on desktop.
- Align banners, skeleton loaders, and empty states with existing design tokens; ensure `aria-live` announcements for status transitions and toasts.
- Provide onboarding helper text/tooltips clarifying each control, dismissible but restorable via info icon.
- Implement theming using Tailwind tokens consistent with F0; respect safe area insets using CSS `env()` when the control bar is docked.

## Validation & Error Handling
- Display explicit error toasts when admin actions fail, offering retry and including correlation IDs for ops debugging.
- In offline mode, mark data as read-only and queue attempted actions with messaging instructing admins to retry when back online.
- Guard against stale data by highlighting when `lastUpdated` exceeds 10 seconds, prompting manual refresh and logging telemetry.
- Provide fallback messaging noting that normalization/export toggles remain out-of-scope until their respective features deliver, linking to forthcoming modules instead of exposing disabled placeholders.
- Ensure unlocking/locking flows handle race conditions gracefully by verifying server state after action responses.

## Testing Strategy
- Unit tests for `useAdminConsoleData` verifying data aggregation, realtime fallback, and optimistic updates.
- Integration tests covering RBAC enforcement, unlock approval flow, timer start/stop, and responsive layout toggling.
- Contract tests ensuring Supabase-generated types align with expected schemas post-migration.
- Accessibility tests (Lighthouse/Pa11y) focusing on keyboard navigation, live region announcements, and color contrast.
- Manual QA checklist for tablet (iPad) and phone (Pixel/iPhone) ensuring control bar usability and safe-area compliance.

## Risks & Mitigations
- **Risk:** Filter breadth and status-only grid could still overload UI if additional analytics are requested late.
  - *Mitigation:* Keep drill-in drawers extensible for extra metrics and modularize filter chips so additional facets can slide in without redesign.
- **Risk:** Performance degradation with large judge/team counts.
  - *Mitigation:* Implement virtualized rendering for grid/list (e.g., React Virtual) if counts exceed thresholds; measure during testing.
- **Risk:** Timer desynchronization between clients.
  - *Mitigation:* Centralize timer state in Supabase with authoritative timestamps; clients compute drift and display sync warnings if offsets exceed 1s.

## Open Items & Follow-ups
- Socialize finalized decisions on data depth, filter requirements, and action ownership with design/backend partners; ensure implementation tasks stay aligned.
- Coordinate with F9 timer feature owners to ensure shared timer components/APIs align and avoid duplication.
- Schedule security review of admin RPCs and RLS changes before implementation; log action items in TODO tracker.
