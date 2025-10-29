---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-14
---

# Feature PRD — F10 Normalization & Drop Extremes

## Overview & Story
Normalization & Drop Extremes empowers head judges and scoring ops to apply statistical adjustments that balance out inconsistent judging while keeping the experience transparent for every participant. Within the finals scoring flow, admins must be able to toggle score normalization and optional high/low score drops per team, observe how totals shift in real time, and communicate any adjustments to judges to maintain trust. Judges should understand when normalization is active and why, while ops teams require authoritative exports that reflect the selected methodology without manual spreadsheet work.

## Goals & Non-Goals
- **Goals**
  - Provide an admin-facing control surface to enable/disable normalization and high/low drop policies per event with auditable state.
  - Reflect normalized totals and drop-extremes adjustments consistently across ranking views, exports, and judge-visible badges.
  - Educate judges about active adjustments through inline messaging, explainer tooltips, and accessible status banners.
  - Ensure calculations run deterministically inside Supabase so all clients share the same derived values even when offline caches are present.
- **Non-Goals**
  - Building bespoke analytics dashboards or historical comparison charts (covered by future analytics work).
  - Allowing per-judge overrides or manual weight tweaks outside of the standardized methodology.
  - Implementing predictive simulations or what-if scenarios beyond the core toggle interactions.

## User Stories
1. **Head Judge (Tablet/Desktop):** I need to activate normalization and drop-extremes policies for the finals event, preview their impact, and communicate changes confidently to the judge cohort.
2. **Scoring Ops (Laptop):** I want exports to clearly indicate whether normalization and drop-extremes were applied so I can hand results to production without spreadsheet adjustments.
3. **Judge (Phone):** I need a clear indication that normalization is active and an explanation of what that means so I can trust the fairness of the final rankings.
4. **Backup Judge (Phone/Tablet):** I need assurance that if my ballot is dropped as an extreme, the system handles it automatically without requiring manual intervention.

## Acceptance Criteria
1. Admins can toggle normalization and drop-extremes independently within the admin console; state persists per event and is audited with timestamp and actor metadata.
2. When normalization is active, rankings, totals, and exports reflect adjusted scores within ≤2 seconds of the toggle change, including recomputation for already submitted ballots.
3. Drop-extreme logic only activates when an event has ≥5 submitted ballots for a team and removes exactly one highest and one lowest aggregate score per team unless overridden by policy.
4. Judges viewing `/score` see a prominent, accessible banner when normalization or drop-extremes are active, linking to an explainer sheet with details about the adjustment.
5. Offline clients display last-known adjustment state and reconcile automatically once back online, ensuring no stale or conflicting messaging.
6. Exports annotate whether normalization or drop-extremes were active at the time of generation and include both raw and adjusted totals for auditing.
7. RBAC restricts adjustment controls to admin/head judge roles; attempts by other roles are denied and logged.
8. Accessibility: banners, toggles, and explainers meet WCAG 2.1 AA, provide screen-reader labels, and are operable via keyboard/touch.

## Dependencies
- **F3** Judge Scoring UI for source totals and per-judge submissions.
- **F4** Autosave & Offline Queue for sync banners and offline reconciliation flows.
- **F6** Submit & Locking for authoritative ballot locking before normalization reruns.
- **F7** Live Ranking for surfacing adjusted totals once calculations complete.
- **F8** Admin Console for housing the toggles and status readouts.
- **Supabase** database functions and RLS policies governing ballot access and derived score storage.

## Decisions & Rationale
1. **Server-side computation:** Run normalization and drop-extreme calculations via Supabase SQL functions to guarantee a single source of truth and minimize client divergence.
2. **Dual-state storage:** Maintain both raw and adjusted totals in event standings tables so exports and UI can switch views without recalculating on the client.
3. **Inline education:** Use Shadcn `Sheet` or `Dialog` components to present plain-language explanations, giving judges context without leaving the scoring flow.
4. **Audit trail:** Log every toggle change with actor, timestamp, and rationale notes to support dispute resolution and transparency.

## Success Metrics
- Normalization toggle latency (time from toggle to updated ranking) ≤ 2 seconds at P95.
- Zero incidents of mismatched normalized totals between UI and exports during finals.
- Judge satisfaction score ≥ 4/5 regarding transparency of scoring adjustments in post-event surveys.
- Ops reports ≤1 manual intervention required for normalization per event.

## Open Questions
1. **Normalization formula selection**
   - *Option A:* Use z-score normalization per judge across all teams, then reapply criterion weights post-normalization.
   - *Option B:* Use min-max scaling within each criterion, producing weighted totals afterward.
   - *Option C:* Normalize against historical baseline from prelim rounds.
   - **Recommendation:** Pursue *Option A* (z-score per judge with post-normalization weighting) because it directly balances judge strictness while keeping compatibility with existing weighted totals. *Pending confirmation from Product* (see master PRD TODO assigned to Product).
2. **Drop-extreme eligibility rules**
   - *Option A:* Drop highest/lowest per team once ≥5 judges submit, ignoring backup judges beyond the first drop.
   - *Option B:* Drop extremes only among primary judges; backups remain excluded unless flagged.
   - *Option C:* Allow admins to choose how many extremes to drop dynamically.
   - **Recommendation:** Adopt *Option A* to keep behavior deterministic and aligned with competition policy, while automatically excluding backup judges once the quorum is satisfied. *Pending ScoringOps confirmation* (see master PRD TODO assigned to ScoringOps).

## References
- Master PRD section [F10 — Normalization & Drop Extremes](masterPRD.md#f10--normalization--drop-extremes-p1) including outstanding clarification TODOs.
- Prior scoring workflows documented in F3, F6, and F7 planning documents.
