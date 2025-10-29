---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-12
---

# Feature PRD — F7 Live Ranking (Gated)

## Overview & Story
Judges and admins need timely visibility into how teams are performing throughout the finals. Feature F7 introduces a live ranking view that translates submitted ballots into up-to-date standings sourced from the Supabase `rankings_view`. Judges gain access to the rankings only after scoring is complete, while admins can monitor progress in real time. The experience must remain mobile-first, pairing glanceable summaries with deeper drill-downs, and operate reliably across intermittent connectivity.

## Goals & Non-Goals
- **Goals**
  - Present an always-fresh ranking surface for admins that reflects raw average scores, sortable on tablets and readable on phones.
  - Unlock rankings for judges automatically once scoring completion criteria are satisfied, ensuring fairness and preventing premature bias.
  - Communicate connectivity or data latency issues transparently so admins and judges understand when data is stale.
  - Support responsive layouts that collapse rankings into cards on smaller viewports while preserving at-a-glance comparison cues.
- **Non-Goals**
  - Introducing score normalization, variance adjustments, or tie-breaking logic beyond what is defined in future features (F10, F11).
  - Building export or share workflows for rankings (covered by F12).
  - Surfacing per-judge score breakdown analytics (reserved for admin console enhancements).

## User Stories
1. **Head Judge/Admin (Tablet):** As an admin overseeing finals, I want to monitor live team standings so I can spot anomalies, pace the event, and prepare announcements.
2. **Judge (Phone):** As a judge, I want to review final standings after all scoring is locked so I understand how teams ranked without influencing my in-progress scoring.
3. **Ops Analyst (Laptop):** As an operations teammate, I need confirmation that rankings have updated after each submission to ensure no sync issues are affecting results.
4. **Offline Judge (Phone):** As a judge with intermittent connectivity, I want clear messaging if rankings cannot load yet so I know whether to retry or wait.

## Acceptance Criteria
1. Admin users can access the live ranking view at any time and see real-time updates driven by Supabase realtime or polling.
2. Judge users see a locked state until gating criteria are met; upon unlock, the rankings populate automatically without requiring a page refresh.
3. Rankings display, at minimum, team name, total raw average score, and delta to preceding team; layout adapts to phone (card stack) and tablet (table) breakpoints.
4. Data refresh cadence is ≤2s when online; stale data >5s triggers a status indicator (badge/banner) and a manual refresh affordance.
5. Offline or error states provide actionable guidance (retry, check connection) and maintain accessibility via `aria-live` announcements.
6. The view respects role-based access control (`usePermissions`/`ProtectedRoute`) ensuring judges cannot bypass gating and admins always retain access.
7. Accessibility: table headers, cards, and status indicators meet WCAG 2.1 AA, support keyboard navigation, and announce unlock transitions via polite live regions.

## Dependencies
- **F3** Judge scoring UI for consistent team metadata and linking into score detail views.
- **F4** Autosave/offline infrastructure for understanding completion state and surfacing connectivity banners.
- **F6** Submit & locking flow to determine when ballots are finalized and ready for ranking inclusion.
- **F8** Admin console shell, which will host or deep link to the ranking view for elevated roles.
- Supabase `rankings_view`, realtime channels, and potential RPCs for gating logic.

## Decisions & Rationale
1. **Single source of truth:** Consume rankings exclusively from the Supabase `rankings_view` so calculations remain server-side and consistent across clients.
2. **Realtime-first refresh:** Attempt realtime subscriptions for low-latency updates, with a structured polling fallback every 5 seconds when realtime disconnects or the client is offline.
3. **Role-aware UI shell:** Implement the ranking screen within the shared routing structure, using guard hooks to enforce gating and reuse skeleton loaders and banners defined in earlier features.
4. **Mobile-first card design:** For phones, render rankings as ordered cards with prominent rank numbers and score typography, referencing the mobile design system tokens from F0.
5. **Unlock announcement:** When judges transition from locked to unlocked state, surface a toast and highlight the unlocked rankings section to call attention without being jarring.

## Risks & Mitigations
- **Risk:** Incomplete gating rules could leak rankings prematurely to judges.
  - *Mitigation:* Block judge access behind the completion signal supplied by F6 locking events and confirm gating logic with product (see Master PRD TODO).
- **Risk:** Large data refresh intervals could misrepresent standings.
  - *Mitigation:* Combine realtime with polling fallback and display explicit “Last updated” timestamps sourced from response metadata.
- **Risk:** Mobile layout might truncate important data on small screens.
  - *Mitigation:* Prioritize core data (rank, team, score, delta) and move secondary metrics into expandable disclosures or admin-only columns on larger breakpoints.
- **Risk:** Offline judges may misinterpret unavailable data as a functional error.
  - *Mitigation:* Provide dedicated offline banners, cached last-known standings (marked clearly as cached), and retry controls once online.

## Success Metrics
- Rankings reflect new submissions within ≤3 seconds for ≥99% of updates during finals.
- Zero incidents of judges viewing rankings before gating conditions are satisfied.
- Positive qualitative feedback from admins around monitoring clarity during pilot.
- Error rate for ranking fetches remains <1% over the finals event window.

## Open Questions
1. **Gating completion rule for judges:** What precise condition should unlock rankings for judges?
   - *Option A:* Require every judge to submit ballots for every team before unlocking globally.
   - *Option B:* Unlock rankings per judge once they have submitted all of their own ballots, regardless of others.
   - *Option C:* Unlock after head judge triggers a manual release from the admin console.
   - *Recommendation:* **Option A** — gating on global completion ensures no judge sees standings before peers finish, aligning with fairness goals. Implementation should still allow admins to override if needed (future enhancement). This depends on Master PRD clarification TODO for final confirmation.
2. **Metrics displayed alongside total score:** Which additional values should accompany the raw average?
   - *Option A:* Only show total raw average and delta to previous rank for simplicity.
   - *Option B:* Include per-criterion averages for transparency.
   - *Option C:* Add variance and submission count to highlight data completeness.
   - *Recommendation:* **Option B** — surface per-criterion averages to provide context for admins while keeping the layout manageable. Judges can see the same breakdown after unlock, supporting informed retrospectives. Await Data owner confirmation (Master PRD TODO).
3. **Realtime delivery mechanism:** Should we rely solely on Supabase realtime or incorporate server-sent events/polling hybrid out of the gate?
   - *Option A:* Realtime only for minimal complexity.
   - *Option B:* Hybrid realtime + polling fallback every few seconds.
   - *Option C:* Polling only with aggressive cache busting.
   - *Recommendation:* **Option B** — hybrid approach balances responsiveness with resilience. Polling fallback protects against websocket drops common on venue Wi-Fi.

## References
- Master PRD section [F7 — Live Ranking (Gated)](masterPRD.md#f7--live-ranking-gated-p0) and associated clarification TODOs.
- Prior features F3–F6 for scoring, comments, autosave, and submission locking contexts.
