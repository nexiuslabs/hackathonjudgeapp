---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-10
---

# Feature PRD — F9 Central Timer Sync

## Overview & Story
The Central Timer Sync feature delivers a single source of truth for pitch and Q&A countdowns during finals. Head judges and ops staff must be able to initiate and control synchronized timers that broadcast consistent remaining time to judges, stage displays, and supporting staff. The timer system needs to tolerate spotty connectivity, provide clear feedback loops, and fail safe so teams are never penalized by drift.

## Goals & Non-Goals
- **Goals**
  - Provide reliable start, pause, resume, reset, and preset selection controls that update every connected client within two seconds.
  - Expose a dedicated, high-contrast timer view optimized for large displays while keeping a compact status badge embedded within judge and admin flows.
  - Maintain authoritative timer state in Supabase (or equivalent) so reconnecting clients can resync immediately without manual input.
  - Offer configurable presets per event (default 7-minute pitch, 5-minute Q&A) with safeguards against accidental changes during live sessions.
- **Non-Goals**
  - Building full agenda scheduling or multi-room orchestration (future operations tooling).
  - Automating audio/visual cues such as stage lights or sound effects.
  - Providing per-judge timers or personal countdowns beyond the shared badge.

## User Stories
1. **Timer Marshal (Tablet/Desktop):** I need an intuitive control surface to start, pause, or reset timers and see confirmation that all clients updated successfully.
2. **Head Judge (Tablet):** I want a responsive timer module inside the admin console so I can monitor remaining time without switching contexts.
3. **Stage Ops (External Display):** I require a shareable full-screen countdown that mirrors the authoritative time so stage teams and audiences stay in sync.
4. **Judge (Phone):** I need a lightweight indicator of remaining time on my scoring screen so I can pace feedback without obstructing scoring controls.

## Acceptance Criteria
1. Admins can start, pause, resume, reset, and switch between at least two presets (7:00 and 5:00) with state changes propagating to subscribed clients within ≤2 seconds under normal connectivity.
2. Timer state persists in Supabase, allowing late-joining clients to display the accurate remaining time within 1 second of loading.
3. A full-screen timer route renders large (≥40px) high-contrast digits, optional landscape lock, and status indicators for current phase (e.g., Pitch vs Q&A).
4. Judge and admin interfaces display a compact badge showing remaining time rounded to the nearest second, updating at least twice per second without blocking UI.
5. Offline clients display a “Timer disconnected” banner and attempt to resync automatically; when resynced, they catch up without manual refresh.
6. RBAC restricts timer control actions to admin/head judge roles; unauthorized attempts are blocked and logged.
7. Accessibility: timer announcements respect reduced motion settings, provide screen-reader friendly labels, and maintain ≥ AA contrast ratios.

## Dependencies
- **F4** Autosave & Offline Queue for connectivity banners and reconnection primitives.
- **F8** Admin Console integration point for timer controls and badge placement.
- Supabase real-time channels or RPCs to broadcast authoritative timer state and epoch data.
- Shared design tokens (F0) for typography and color to ensure consistency across timer views.

## Decisions & Rationale
1. **Server-authoritative epoch:** Store a canonical `started_at` timestamp and `duration_seconds` in Supabase; clients compute remaining time locally to minimize updates and tolerate latency.
2. **Preset guardrails:** Allow only predefined durations per event to avoid mid-round mistakes. Changes require confirmation modals and are disabled while a timer is running.
3. **Dual presentation:** Deliver both embedded badges (React component) and a dedicated `/timer` route that subscribes to the same state to support large-format displays without duplicating logic.
4. **Heartbeat health checks:** Clients emit periodic pings; if no update for >3 seconds, display a reconnecting badge and fallback poll to restore state.
5. **Orientation handling:** Offer an optional “lock orientation” toggle on the full-screen timer to encourage landscape usage on tablets while respecting user override for accessibility.

## Risks & Mitigations
- **Risk:** Network latency introduces noticeable skew between clients.
  - *Mitigation:* Use epoch-based calculations with local drift correction and occasional server-issued `sync` events to realign time.
- **Risk:** Admin accidentally resets timer mid-pitch.
  - *Mitigation:* Require confirmation for destructive actions and provide an undo grace period (e.g., 3 seconds) when stopping or resetting.
- **Risk:** Large display devices lose connection and freeze.
  - *Mitigation:* Implement offline banners, auto-retry logic, and manual refresh affordances; document fallback (manual stopwatch) in ops runbook.
- **Risk:** High-frequency updates hurt mobile performance.
  - *Mitigation:* Limit broadcast frequency to essential state changes and let clients handle per-second countdown locally via requestAnimationFrame.

## Success Metrics
- Timer drift between any two connected devices ≤ 0.5 seconds after steady state.
- ≥ 95% of timer control actions acknowledge within 1 second in the admin UI.
- Zero finals rounds require manual re-run due to timer malfunction.
- Post-event ops satisfaction score ≥ 4/5 regarding timer reliability.

## Open Questions
1. **Preset management UI location:**
   - *Decision:* Adopt **Option A** — manage presets directly within the admin console timer drawer. This keeps adjustments within reach during rehearsals and live shows while confirmation prompts and role-based permissions prevent accidental changes.
2. **Phase labeling:**
   - *Decision:* Adopt **Option B** — allow presets to carry custom labels with defaults of Pitch and Q&A. This supports alternative formats (e.g., lightning rounds) without diverging from the master PRD expectations.
3. **External display distribution:**
   - *Decision:* Adopt **Option B** — surface a cast/QR share button in the admin console that generates a short-lived tokenized `/timer` link so stage ops can join quickly with minimal typing.

## References
- Master PRD section [F9 — Central Timer Sync](masterPRD.md#f9--central-timer-sync-p1) and associated decisions recorded there.
- F8 Admin Console PRD for integration expectations.
