---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-04
---

# Dev Plan — F2 Brief (Mobile Nav + Anchors)

## Architecture & Flow Overview
- Implement `/brief` route leveraging Feature F0 layout primitives with a vertically stacked section scaffold and sticky anchor navigation component that activates after the hero viewport.
- Structure content as modular React components within `src/components/brief/` (e.g., `BriefHero`, `BriefAnchorNav`, `CriteriaAccordion`, `RosterSection`, `ContactCard`).
- Manage anchor state via Intersection Observer (with React hook wrapper) to highlight active sections and sync with URL hash for deep linking.
- Ensure the scoring CTA checks current auth/event context (from F1/F3 shared store) before routing to `/score`, presenting helper tooltip if prerequisites missing.

## Data & State Management
- Fetch structured content (`hero`, `overview`, `flow`, `problems`, `contact`) from Supabase tables (or views) using React Query with stale-while-revalidate configuration; provide fallback to preloaded JSON snapshot for offline use.
- Retrieve judges and finalists lists via Supabase RPC or view endpoints, storing results in React Query caches and mirroring into IndexedDB/localStorage for offline rendering.
- Maintain UI state for accordions, anchor chip overflow (scroll position), and offline banners using local component state augmented by a shared `useConnectivity` hook from Feature F0/F4.
- Provide manual refresh action that invalidates queries and triggers data re-fetch, with status toasts and telemetry logging.

## Backend & Migrations
- Define Supabase tables/views as needed:
  - `brief_content` keyed by `event_id` with sections stored as structured JSON blocks.
  - `finalists_view` consolidating team metadata, problem track, and presentation order for finals-ready display.
  - `judges_view` exposing public-safe judge names, bios, and headshots with publication flags.
- Apply RLS policies to restrict write access to service roles/ops while allowing read access to authenticated judges and public read for non-sensitive sections (hero/overview) if required.
- Coordinate with Feature F13 to audit fields for PII and ensure exposures align with compliance requirements.

## API & Integration Design
- Extend `src/lib/api.ts` with fetchers: `getBriefContent(eventId)`, `getFinalists(eventId)`, and `getJudges(eventId)` returning typed payloads.
- Add helper `prefetchBriefData(eventId)` to warm caches during app shell load (PWA shell requirement) and hydrate offline storage.
- Instrument API calls with logging hooks to capture load duration, failure counts, and fallback usage (tie into analytics plan from Feature F14 when available).

## UI Components & UX Details
- `BriefHero`: hero card with event badge, key dates, CTA button, and helper tooltip/popover describing scoring process.
- `BriefAnchorNav`: horizontally scrollable chip list with active-state indicator, keyboard navigable, collapses into dropdown on small widths; persists selected state across reload via URL hash.
- `CriteriaAccordion`: Shadcn accordion variant with summary bullets, expandable details, and embedded icons illustrating scoring weight.
- `TimelineSection`: visual flow with step cards, optional timeline iconography, and inline tooltips.
- `RosterSection`: shared component for judges/finalists rendering responsive cards with avatars, tags, and fallback illustrations for empty/error/offline states.
- Global loading skeletons and inline error banners with retry actions for each data-driven section.

## Testing Strategy
- Unit tests for API fetchers using mocked Supabase client verifying caching behavior and offline persistence integration.
- Component tests covering anchor navigation (active state updates, keyboard support), accordions (accessibility attributes), and roster rendering (loading/empty/error states).
- Integration test ensuring CTA routes authenticated judge to `/score` with event parameter and that offline cached data renders when network requests fail.
- Visual regression snapshots for hero, criteria, and roster components at mobile and tablet breakpoints to maintain design consistency.

## Risks & Mitigations
- **Risk:** Intersection Observer support gaps on older browsers impact anchor highlighting.
  - *Mitigation:* Provide fallback to scroll event listeners with throttling and ensure observer polyfill is bundled for unsupported environments.
- **Risk:** Offline cache drift causes stale data to persist after updates.
  - *Mitigation:* Store cache timestamps, show "Updated" labels, and force refresh when Supabase indicates newer revision IDs.
- **Risk:** Large images for judges/finalists degrade performance on mobile.
  - *Mitigation:* Use responsive image sources (Supabase Storage transformations) and lazy-load below-the-fold assets.

## Open Items & Follow-ups
- Document Supabase `brief_content` schema details aligned with 2024-02-06 decisions and circulate for data-model review.
- Align with Feature F14 to define analytics events for anchor interactions and CTA usage.
- Coordinate with design team to secure final illustration assets for hero and empty states.
