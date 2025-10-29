---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-14
---

# Dev Plan — F10 Normalization & Drop Extremes

## Architecture & Flow Overview
- Introduce an event-level `scoring_adjustment_state` domain that captures whether normalization and drop-extremes are active, along with metadata for the selected methodology and last toggle event.
- Host adjustment controls inside the Admin Console (`/admin`) as part of an `AdjustmentsPanel` section that surfaces current state, impact summaries, and quick links to audit logs.
- Run recomputation via Supabase stored procedures that recalc normalized and raw aggregates on demand; triggers should fire when adjustments toggle or when new ballots arrive.
- Persist adjusted standings in a dedicated table (`event_standings_normalized`) that mirrors raw standings so ranking views and exports can query without heavy joins.
- Notify connected clients through realtime channels (`adjustments:eventId`) that push updated adjustment state and derived totals, allowing judge and ranking screens to refresh immediately.

## Data & State Management
- Extend TypeScript types under `src/types/scoring.ts` to include `AdjustmentState`, `AdjustmentMethod`, `NormalizedStanding`, and `AdjustmentAuditEntry` interfaces.
- Store adjustment state locally using React Query with cache keys scoped by `eventId`; hydration should include both state toggles and derived standing payloads for offline resilience.
- Build a `useAdjustmentState(eventId)` hook that wraps Supabase fetches, subscribes to realtime updates, and exposes helpers for toggling adjustments with optimistic UI feedback and rollback handling.
- Maintain both raw and adjusted totals in client context to allow instant switching between views without refetching, while clearly labelling adjusted vs raw values in UI components.
- Persist the last acknowledged adjustment banner state in IndexedDB alongside offline queue metadata to re-show messaging when users come back online.

## Backend & Migrations
- Create Supabase migrations for:
  - `scoring_adjustment_state` table: columns for `event_id`, `normalization_enabled`, `drop_extremes_enabled`, `method`, `notes`, `updated_at`, `updated_by`, and `revision` integer for concurrency control.
  - `scoring_adjustment_audit` table logging history (`id`, `event_id`, `actor_id`, `action`, `notes`, `created_at`).
  - `event_standings_normalized` view or materialized table that stores normalized totals per team, judge counts used, dropped judge IDs, and metadata linking back to raw standings.
  - Supabase SQL functions:
    - `apply_normalization(event_id uuid)` performing the agreed-upon normalization algorithm and updating `event_standings_normalized`.
    - `apply_drop_extremes(event_id uuid)` recalculating totals while excluding extremes based on quorum rules.
    - `set_scoring_adjustments(event_id uuid, normalize boolean, drop_extremes boolean, method text, actor uuid, notes text)` to toggle state, invoke recalculation functions, and insert audit log rows.
  - Triggers to re-run normalization/drop-extreme recalculations on ballot insert/update when relevant toggles are active.
- Update RLS policies ensuring only admin/head judge roles can mutate adjustment tables or invoke the toggle function; judges may read aggregated results but not audit history beyond their scope.
- Regenerate Supabase types with `pnpm supabase types` and update `src/types/database.ts`.

## API & Integration Design
- Extend `src/lib/api.ts` with helpers: `getAdjustmentState(eventId)`, `toggleAdjustments(payload)`, `subscribeAdjustments(eventId)`, `fetchNormalizedStandings(eventId)`, and `listAdjustmentAudits(eventId)`.
- Implement a dedicated service module `src/lib/scoringAdjustments.ts` encapsulating normalization-specific fetch logic, caching, and transformation utilities to keep components lean.
- Add telemetry hooks when toggles change (e.g., `normalization_enabled`, `drop_extremes_enabled`) to feed analytics defined in F14, ensuring events capture actor, eventId, and method.
- Ensure exports pipeline (F12) can request normalized data via API parameters (`?mode=normalized|raw|both`) and annotate metadata accordingly.

## UI & UX Implementation
- Build reusable components within `src/components/admin/adjustments/`:
  - `AdjustmentToggleCard` using Shadcn `Card`, `Switch`, and `Tooltip` to show toggle state, method label, and last updated metadata.
  - `AdjustmentImpactList` summarizing key changes (e.g., teams whose rank shifted) with expandable rows for detailed breakdowns.
  - `AdjustmentExplainerSheet` accessible from judge banner, presenting plain-language explanation, methodology summary, and contact info.
- Integrate a persistent banner component (`NormalizationBanner`) in judge and ranking routes, respecting safe areas and supporting focus management when triggered.
- Provide onboarding helper text in the admin panel explaining when to enable adjustments, plus inline links to policy documents.
- Ensure responsive layout: on phones, toggles stack vertically with accessible spacing; on tablets/desktops, present side-by-side cards.
- Localize content tokens through shared i18n utilities so copy can be updated without code changes.

## Testing Strategy
- Unit tests for normalization utilities ensuring algorithms produce expected outputs given fixture data sets (raw vs normalized vs dropped extremes).
- Integration tests hitting Supabase functions via local test harness to confirm recalculations run and audit logs persist correctly when toggles change.
- React Testing Library coverage for `useAdjustmentState`, admin panel components, and judge-facing banners verifying accessibility attributes and state propagation.
- End-to-end scenarios using Playwright: admin toggles normalization, rankings update, judge sees banner, exports include adjusted totals.
- Performance tests verifying recalculation completes within target latency at dataset sizes representing finals (e.g., 20 teams × 12 judges).

## Risks & Mitigations
- **Risk:** Normalization algorithms introduce regressions if formulas change late.
  - *Mitigation:* Keep algorithm encapsulated in SQL functions with unit tests and double-check values against sample spreadsheets from ScoringOps.
- **Risk:** Toggling adjustments during live scoring causes race conditions with incoming ballots.
  - *Mitigation:* Use transactional SQL functions with revision checks; surface locking UI while recalculation runs, and queue toggles until completion.
- **Risk:** Judges mistrust adjustments due to lack of transparency.
  - *Mitigation:* Provide clear copywriting, accessible explainers, and include raw vs adjusted totals in exports and judge-facing modals.
- **Risk:** Realtime updates overwhelm clients or fail offline.
  - *Mitigation:* Throttle realtime broadcasts, rely on incremental fetch fallback, and display stale data banners when updates lag.

## Rollout & Monitoring
- Pilot normalization toggles with rehearsal event prior to finals; capture logs and gather judge feedback via surveys documented in `todo_F10.md`.
- Instrument telemetry for toggle usage, recalculation duration, and error rates; expose dashboards to ops.
- Add runbook updates covering rollback steps (disable toggles, revert to raw standings) if anomalies occur.
- Coordinate with documentation team to publish judge FAQ updates ahead of finals.
