---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-13
---

# Feature PRD — F8 Admin Console (Responsive)

## Overview & Story
The Admin Console is the operational hub for head judges and event ops staff during finals. It must provide a comprehensive, responsive view of judging progress, enabling real-time decisions such as unlocking ballots, initiating timers, and preparing exports without juggling multiple tools. The experience targets tablets first but must remain effective on phones for on-the-floor triage, adapting the dense grid of judge × team completion states into list-based summaries with a persistent controls bar.

## Goals & Non-Goals
- **Goals**
  - Present a live-updating matrix of judge progress across all teams with clear status indicators and drill-ins for detail.
  - Offer quick access to essential admin actions (unlock requests, event lock, timer controls) within a responsive layout that prioritizes thumb reach on tablets and phones.
  - Surface health signals (connectivity, stale data, pending autosave queues) so ops can intervene rapidly.
  - Provide hooks into exports and ranking views without duplicating downstream feature logic.
- **Non-Goals**
  - Implement normalization, tie-break workflows, or export generation logic (covered by F10–F12); this console only links to or orchestrates those flows once delivered.
  - Build analytics dashboards or historical reporting beyond real-time progress indicators.
  - Replace existing judge scoring UI or comments surfaces.

## User Stories
1. **Head Judge (Tablet):** As the head judge, I need a bird’s-eye view of every judge’s submission status per team so I can identify blockers and trigger event-level actions quickly.
2. **Ops Coordinator (Phone):** As an ops team member walking the venue, I want a compact list view of teams needing attention, with the ability to approve unlocks or resend links on the go.
3. **Timer Marshal (Tablet/Desktop):** As the person running timers, I want clear start/pause controls and visibility into the current countdown without leaving the console.
4. **Data Steward (Laptop):** As the data steward, I need confidence that exports and rankings will reflect the latest submissions before I trigger them from the console.

## Acceptance Criteria
1. The console renders a responsive judge × team completion view on tablets/desktops and collapses into grouped lists on phones, maintaining parity of status information.
2. Status indicators differentiate at least `pending`, `in-progress`, `submitted`, and `locked` states, reflecting realtime updates within 2 seconds when online.
3. A sticky controls bar provides access to timers, unlock approvals, event lock, and links to rankings/exports without scrolling, regardless of viewport.
4. Offline or degraded connectivity triggers banners consistent with F4 patterns and disables destructive admin actions until reconnection.
5. RBAC enforces that only admins/head judges can access the console route, redirecting unauthorized users with an explanatory message.
6. Console interactions (unlock approval, timer start, lock event) provide immediate feedback via toasts and reflect updated state in the grid/lists.
7. Accessibility: all controls are keyboard reachable, tables/lists include semantic headers, and status changes announce via polite `aria-live` regions.

## Dependencies
- **F3** Judge scoring UI and data model for submission statuses.
- **F4** Autosave/offline queue infrastructure driving connectivity banners and pending counts.
- **F6** Submit & locking mechanics for event-level state transitions and unlock requests.
- **F7** Live ranking view, which the console must link to once accessible.
- Supabase tables/views delivering judge progress, unlock requests, timer state, and event metadata.

## Decisions & Rationale
1. **Responsive-first layout:** Design tablet view as the canonical grid using Shadcn `Table` components, then derive a list/card variant for phones to honor the Master PRD requirement of collapsing without horizontal scroll.
2. **Shared realtime channel:** Reuse existing Supabase realtime subscriptions for ballots/unlock requests to avoid duplicative polling logic and ensure consistent updates across features.
3. **Modular controls bar:** Implement the sticky controls bar as a reusable component (`AdminControlBar`) so future features (F9–F12) can slot additional actions without reworking layout.
4. **State coalescing:** Aggregate progress data server-side (view or RPC) to minimize client joins, reducing latency on mobile networks and simplifying caching strategies.
5. **Status-first progress view:** Default the grid/list to submission-status indicators and expose per-criterion insights through drill-in drawers to balance clarity with privacy. Aligns with Master PRD decision on data depth.
6. **Robust filtering:** Provide multi-select filters for team track, judge cohort, and status to keep large-event operations manageable on all breakpoints.
7. **Scoped admin actions:** Limit in-scope controls to lock/unlock flows and shared timer management, linking out to normalization and export modules when those features land.

## Risks & Mitigations
- **Risk:** Grid density may overwhelm smaller tablet screens, reducing clarity.
  - *Mitigation:* Introduce column pinning and progressive disclosure (expanders/tooltips) plus configurable sort/filter per Master PRD decision on filters.
- **Risk:** Overlapping responsibilities with upcoming features could create duplicated actions or conflicting UX.
  - *Mitigation:* Track scope boundaries against recorded Master PRD decisions; gate advanced toggles behind feature flags until dependent features land.
- **Risk:** Realtime updates may lag under venue Wi-Fi, leading to stale statuses.
  - *Mitigation:* Display last-updated timestamps, provide manual refresh, and fall back to short-interval polling when realtime disconnects.

## Success Metrics
- ≥95% of admin interactions (unlock approvals, timer actions) reflect in the UI within 2 seconds.
- Head judge satisfaction ≥4/5 in post-event survey regarding situational awareness from the console.
- Zero incidents of unauthorized access to the admin console during finals.
- <1% of unlock approvals require manual reconciliation due to state desync.

## Open Questions
_None — previously open items resolved via Decisions & Rationale._

## References
- Master PRD section [F8 — Admin Console (Responsive)](masterPRD.md#f8--admin-console-responsive-p0) and associated product decisions.
- Feature specs and dev plans for F3–F7 establishing scoring workflow context.
