---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-07
---

# Dev Plan — F3 Judge Scoring UI (Sliders 1–10)

## Architecture & Flow Overview
- Introduce a dedicated `/score` route view module structured as a stateful container (`ScorePage`) that coordinates data loading, autosave hooks (from F4), and submission orchestration (F6 integration hooks stubbed until implementation).
- Organize UI into reusable components under `src/components/score/`:
  - `ScoreCriteriaList` for rendering dynamic criteria cards with sliders and helper text.
  - `ScoreSliderCard` to encapsulate label, guidance, slider input, and validation messaging.
  - `ScoreStickyBar` providing total preview, status indicators, and primary/secondary actions.
- Implement responsive layout using Tailwind + Shadcn primitives, prioritizing single-column scroll with sticky submit region attached to viewport bottom respecting safe-area insets.

## Data & State Management
- Fetch scoring criteria metadata via React Query hook `useScoringCriteria(eventId)` that surfaces labels, descriptions, default states, weighting, and ordering; cache results for offline use via the shared storage abstraction defined in F4.
- Maintain local component state for slider values using a reducer keyed by criterion ID, enabling deterministic updates and integration with autosave payloads.
- Derive computed total via selector that applies weighting constants supplied by the metadata response; memoize calculations to update within the 100ms acceptance criterion.
- Track validation status per criterion (`pristine`, `incomplete`, `valid`) and overall form readiness, exposing this to the sticky bar for UI messaging.
- Integrate connectivity and autosave signals from F4 hooks (`useConnectivity`, `useAutosaveQueue`) to surface offline/queued states in the sticky bar.

## Backend & Migrations
- Coordinate with data modeling to ensure Supabase exposes a `scoring_criteria` table/view containing `event_id`, `criterion_id`, `label`, `helper_copy`, `weight`, `default_value` (nullable), and ordering fields.
- Ensure RLS policies allow authenticated judges read access scoped to their assigned events while preventing leakage across events.
- Define a Supabase edge function or RPC stub (if not existing) for submitting scores (`submit_score(event_id, team_id, payload)`), though full implementation lands with F6; capture interface requirements here for alignment.

## API & Integration Design
- Extend `src/lib/api.ts` with:
  - `getScoringCriteria(eventId: string)` returning typed metadata array.
  - `calculateWeightedTotal(criteria: CriterionMeta[], scores: Record<string, number>)` shared helper exporting weighting logic for reuse in tests.
- Build custom hook `useScoreForm(eventId, teamId)` to encapsulate loading states, score mutations, validation, and derived totals. Hook should expose methods for value changes, reset, and submission stub (calling into F6 placeholder).
- Instrument events for analytics (planned with F14) such as `score_slider_adjusted`, `score_total_viewed`, and `score_submit_attempted`, capturing metadata like criterion ID and connectivity state.

## UI Components & UX Details
- Leverage Shadcn `Slider` component wrapped in `ScoreSliderCard` to ensure consistent ARIA attributes; enhance with numeric readout badge and helper text below.
- Provide onboarding tooltip or inline banner on first load explaining scoring steps and referencing the judging brief for criteria meaning.
- Sticky bar displays:
  - Total badge with tooltip describing weighting formula.
  - Primary action button (`Submit Scores`) with disabled state and progress spinner when pending.
  - Secondary action (`Save & Exit` or `Back to Brief`) placeholder for integration with F4/F6 decisions.
- Include skeleton loaders for slider cards and shimmer for sticky bar while metadata loads.
- Add error boundary component specific to scoring that offers retry and contact instructions if critical data fails to load.
- Ensure focus order flows from top instructions → criteria sliders → sticky bar controls; implement skip-to-submit link for keyboard users.

## Testing Strategy
- Unit tests for `calculateWeightedTotal` verifying rounding behavior and parity with backend-provided fixtures.
- Component tests for `ScoreSliderCard` covering keyboard interactions, value display, and validation messaging toggles.
- Integration test for `ScorePage` mocking API responses to validate sticky bar total updates, offline banner behavior (via mocked connectivity hook), and submit button enablement logic.
- Accessibility tests (e.g., jest-axe) ensuring slider semantics, focus outlines, and skip links meet WCAG requirements.
- Visual regression tests at mobile and tablet breakpoints focusing on slider cards and sticky bar states (default, validation error, offline, ready to submit).

## Risks & Mitigations
- **Risk:** Inconsistent metadata shape between Supabase and UI expectations causes runtime failures.
  - *Mitigation:* Define shared TypeScript types for criteria responses and enforce via Zod schema validation when parsing API payloads.
- **Risk:** Sticky bar overlap with device safe areas impairs interaction.
  - *Mitigation:* Apply CSS env safe-area insets and test on emulated iPhone/Android devices; add padding adjustments when virtual keyboard is open.
- **Risk:** Performance degradation on low-end devices when re-rendering sliders.
  - *Mitigation:* Memoize slider components, debounce state updates when dragging, and limit analytics event firing frequency.

## Open Items & Follow-ups
- Ensure implementation adheres to the finalized decisions on criteria sourcing, weighting, and slider defaults captured in the master PRD and feature PRD.
- Coordinate with Feature F4 owners to define autosave integration points (`onChange` payload format, queue identifiers).
- Align with design team for final layout specs (spacing, iconography) and ensure Storybook entries are produced for scoring components.
