---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-10
---

# Dev Plan — F9 Central Timer Sync

## Architecture & Flow Overview
- Represent timer state as a single `admin_timer_state` record per event containing `phase`, `duration_seconds`, `started_at`, `paused_at`, and `control_owner` metadata.
- Timer controls live inside the Admin Console (`/admin`) as a Shadcn `Sheet` or `Card` component anchored in the `AdminControlBar`; actions invoke Supabase RPCs to mutate the canonical timer state.
- Judges and other clients consume a read-only hook (`useEventTimer`) that subscribes to realtime updates and computes derived countdown values locally.
- Expose a dedicated `/timer` route that renders a full-screen countdown optimized for external displays. The route reads an optional token query param for read-only access and supports orientation lock hints.
- Employ optimistic UI updates in the admin control panel while awaiting confirmation from Supabase; roll back if the RPC fails or conflicts with newer state.

## Data & State Management
- Define TypeScript types in `src/types/timer.ts` for `TimerPhase`, `TimerState`, `TimerControlAction`, and `TimerPreset`.
- Store presets per event in a `event_timer_presets` table (`id`, `event_id`, `label`, `duration_seconds`, `is_default`, timestamps). Cache them client-side via React Query keyed by `eventId` and invalidated when modified.
- Timer state hook (`useEventTimer`) calculates `remainingMs`, `isRunning`, and `driftMs` using `Date.now()` comparisons against `started_at` and `paused_at`. It triggers a local resync if drift exceeds 400ms.
- Maintain a small in-memory queue of pending control actions to show feedback (e.g., “Starting timer…” toast) and guard against duplicate rapid taps.
- Persist last-known timer state in IndexedDB alongside other offline caches so reconnecting clients can display stale data banner rather than blank states.

## Backend & Migrations
- Create migrations for:
  - `event_timer_presets` table with FK to `events`, unique constraint on (`event_id`, `label`), and soft delete via `archived_at` (nullable).
  - `event_timer_state` table storing `event_id`, `phase`, `duration_seconds`, `started_at`, `paused_at`, `control_owner`, `updated_at`, and `revision` (incrementing integer for conflict detection).
  - Supabase function `call_timer_action(event_id uuid, action text, preset_id uuid, actor uuid)` that encapsulates start/pause/resume/reset logic, updates `event_timer_state`, increments revision, and emits realtime payload.
  - Optional materialized view or computed column for `expires_at` to simplify countdown calculations on clients.
- Update RLS policies: only admin/head judge roles can modify timer tables or invoke control RPC; read access granted to authenticated judges for state consumption, and optionally to anonymous token-based viewers via signed access policy.
- After migrations, run `pnpm supabase types` to refresh generated types and update `src/types/database.ts` accordingly.

## API & Integration Design
- Extend `src/lib/api.ts` with timer helpers: `fetchTimerState(eventId)`, `subscribeTimerState(eventId, onUpdate)`, `listTimerPresets(eventId)`, `upsertTimerPreset(preset)`, `triggerTimerAction({ eventId, action, presetId })`, and `generateTimerShareLink(eventId)`.
- Implement a `useTimerControls` hook within `src/hooks` that wraps RPC calls, enforces debounce, handles optimistic updates, and surfaces telemetry events (`timer_started`, `timer_paused`, etc.).
- Build a share-link generator using Supabase Edge Function or signed JWT that returns a short-lived URL for `/timer?token=...`; store expiry in state for display on admin console with QR code.
- Ensure `/timer` route uses `ProtectedRoute` when no token provided and a lighter-weight guard when token query param is present (validate via supabase function or hashed payload).

## UI & UX Implementation
- Timer control module components:
  - `TimerBadge` (used in judge/admin layouts) rendering remaining time, phase, and connectivity status with color-coded states.
  - `TimerControlPanel` inside admin console with preset selector (shadcn `Select`), large start/pause/reset buttons, undo snackbar, and status readouts (last updated, controller name).
  - `TimerShareSheet` presenting QR code, copy link button, and expiry countdown for the full-screen display link.
  - `/timer` page built with Shadcn `Card` and responsive typography; includes optional orientation lock prompt, reduced-motion friendly animations, and haptic tick (vibration) when available.
- Provide onboarding helper text describing workflow (e.g., “Start Pitch when team begins speaking. Use Pause for emergencies.”) with ability to dismiss.
- Align with Tailwind theme tokens and ensure safe-area padding is applied for full-screen mode via CSS `env()` values.
- Accessibility: announce timer changes using polite `aria-live`; support keyboard shortcuts (`space` to pause/resume) on admin panel; ensure high contrast and focus outlines.

## Testing Strategy
- Unit tests for `useEventTimer` verifying drift correction, pause/resume transitions, and offline fallback messaging.
- Integration tests covering timer control RPCs (start/pause/reset), preset management flows, share-link generation, and RBAC enforcement.
- UI tests (React Testing Library) ensuring badges update on realtime events, admin controls display confirmations, and `/timer` renders accessible markup.
- End-to-end smoke test (Playwright or Cypress) simulating two clients to confirm drift ≤0.5s and reconnection logic.
- Run Lighthouse/Pa11y audit on `/timer` route to validate accessibility and contrast requirements.

## Risks & Mitigations
- **Risk:** Timer RPC conflicts when multiple admins issue commands simultaneously.
  - *Mitigation:* Use revision numbers and `control_owner` locking; reject conflicting actions with clear error messaging and encourage single-controller workflow.
- **Risk:** Share links leaked publicly.
  - *Mitigation:* Sign links with short expiry, allow immediate revocation from admin panel, and log access events for auditing.
- **Risk:** IndexedDB cache becomes stale and confuses users upon reconnect.
  - *Mitigation:* Display “Timer may be stale” banner if cached timestamp older than 30 seconds and auto-refresh on network restore.
- **Risk:** Orientation lock conflicts with accessibility needs.
  - *Mitigation:* Implement non-blocking suggestion (using Screen Orientation API when available) and provide fallback instructions rather than forcing lock.

## Rollout & Monitoring
- Feature flag timer controls per event to allow rehearsal testing without affecting live finals.
- Instrument telemetry capturing control actions, drift metrics, and reconnection counts; feed into Observability plan (F14) once available.
- Document manual fallback procedure (stopwatch) in ops runbook and add TODO entry for verifying before event day.
- Schedule rehearsal QA session with at least three device types (tablet, phone, large monitor) to validate synchronization.
