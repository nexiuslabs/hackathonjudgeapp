---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-04
---

# Feature PRD — F2 Brief (Mobile Nav + Anchors)

## Overview & Story
Judges and organizers need a concise, mobile-friendly brief that orients them before and during finals. Feature F2 delivers a single scrolling page that surfaces event essentials, judging criteria, team lineups, and a prominent launch point into the scoring flow. The experience must respect mobile-first ergonomics, support rapid content comprehension between sessions, and gracefully handle dynamic data updates for judges and finalists without disrupting offline resilience.

## Goals & Non-Goals
- **Goals**
  - Present the full judging brief as a structured, scrollable page optimized for phone use with sticky anchor navigation.
  - Provide quick access to the scoring application via contextual calls to action that reflect the active event.
  - Render judges, finalists, and problem statements with up-to-date data sourced from Supabase while maintaining offline fallbacks.
  - Supply onboarding aids (tooltips, helper copy) that explain flow order, scoring expectations, and support contacts.
- **Non-Goals**
  - Build a full CMS authoring interface for brief content updates (authoring is handled upstream by ops/product).
  - Implement scoring interactions or authentication (covered in F1/F3 and beyond).
  - Deliver full admin editing capabilities for judges/finalists (covered by future tooling and Feature F15).

## User Stories
1. **Judge (pre-brief):** As a judge on my phone, I want a quick overview of event flow, judging criteria, and finalist summaries, so I can prepare before scoring begins.
2. **Judge (in-session reference):** As a judge between team sessions, I want to quickly jump to criteria explanations or problem statements without losing my place, so I can refresh details before scoring the next team.
3. **Head Judge / Ops:** As an organizer on a tablet, I want to verify that judges see the latest finalist roster and contact guidance, so I can ensure consistent information sharing.

## Acceptance Criteria
1. Mobile view presents hero, overview, flow timeline, criteria accordions, scoring CTA, problems, judges, finalists, and contact sections in the prescribed order without horizontal scrolling.
2. Sticky anchor navigation appears after initial scroll, highlights the in-view section, and supports smooth scrolling with focus management for accessibility.
3. Dynamic sections (judges, finalists) retrieve data from Supabase with loading, empty, and error states, and cache last-known data for offline use.
4. Call-to-action button deep links to `/score` with the current event identifier, displaying helper text on hover/focus/tap about scoring requirements.
5. All interactive elements meet ≥44px hit area and pass WCAG 2.1 AA contrast checks; keyboard navigation cycles anchors and accordions correctly.
6. Page renders gracefully on tablets and desktops, maintaining responsive layout tokens defined in Feature F0.

## Dependencies
- Feature F0 foundational shell for layout primitives, typography, and navigation scaffolding.
- Feature F1 authentication to gate scoring CTA and determine current event context when linking to `/score`.
- Supabase tables or views providing judges, finalists, and problem statements with publication flags for finals content.
- Decision outcomes from Master PRD TODOs clarifying content management and data sync strategy.

## Decisions (Resolved from Open Questions)
1. **Hero/overview content source — Adopt Supabase content tables (Option A).**
   - Store structured JSON blocks in Supabase `brief_content`, enabling last-minute edits without redeployments while still prefetching snapshots for offline availability.
2. **Judges/finalists data refresh cadence — Use background refetch + manual refresh (Option B).**
   - Load rosters via Supabase views with stale-while-revalidate intervals and expose a refresh control, keeping bandwidth usage low and implementation simpler than realtime channels.
3. **Offline fallback strategy — Persist last-known payloads client-side (Option A).**
   - Cache recent responses in IndexedDB/localStorage with freshness timestamps and surface an offline banner when rendering cached content so judges maintain access during connectivity drops.

## Risks & Mitigations
- **Risk:** Anchor navigation becomes unwieldy on smaller devices.
  - *Mitigation:* Implement horizontally scrollable chip list with snap behavior and ensure keyboard focus cycling; collapse to dropdown if width constrained.
- **Risk:** Supabase queries fail due to connectivity, leaving stale or missing data.
  - *Mitigation:* Cache last-known payloads, surface retry controls, and instrument errors for ops visibility.
- **Risk:** Content volume overwhelms mobile readers.
  - *Mitigation:* Use progressive disclosure (accordions, expandable cards) and provide summary bullets at the top of each section.

## Success Metrics
- ≥90% of judges report finding the scoring CTA within 5 seconds during usability checks.
- Anchor navigation interaction success rate ≥95% (taps navigate to intended section without additional scroll adjustments).
- Offline cached data renders within 1.5s of opening the brief when previously loaded online.
