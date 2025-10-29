---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-02
---

# Feature PRD — F0 Platform, Theme, PWA Shell

## Overview & Story
As the AI-Ignition finals judging team, we need a reliable mobile-first shell that sets the foundational theme, global layout primitives, and installable PWA experience so that all subsequent features inherit consistent styling and offline-ready behavior. This includes establishing our design tokens, base routing, and baseline performance budgets to ensure judges can access the experience instantly even on flaky venue networks.

## Goals & Non-Goals
- **Goals**
  - Define the base theming system (color, typography, spacing) using Tailwind tokens shared across brief and scoring surfaces.
  - Implement core layout scaffolding (navigation container, responsive breakpoints, safe-area handling) optimized for phones.
  - Deliver minimum PWA functionality (manifest + service worker) that precaches the application shell and agreed-upon content assets.
  - Ensure base performance budgets are met (initial JS bundle <250KB gzipped, responsive first meaningful paint).
- **Non-Goals**
  - Implement feature-specific screens (brief content, scoring components) beyond placeholder routes.
  - Build advanced offline queueing or data sync beyond caching the shell and designated static payloads.
  - Finalize branding illustrations or marketing copy outside of the shared theme tokens.

## User Story
> As a judge arriving on-site, I want to install and open the judging app quickly with consistent theming so that I can trust the experience before scoring begins.

## Acceptance Criteria
1. Tailwind configuration exposes design tokens for colors, spacing, typography, and radii validated against the final token source of truth.
2. Global layout supports mobile-first breakpoints with safe-area padding and 44px tap targets, verified on iPhone and Pixel reference devices.
3. Web app manifest defines icons, name, display mode, and orientation so the app is installable on iOS Safari and Android Chrome.
4. Service worker caches the application shell and agreed-upon static assets, serving them offline with versioned updates.
5. Vite build output stays within the <250KB gzipped JS budget for the initial bundle.
6. Placeholder routes for `/brief`, `/score`, and `/admin` load within 2.2s LCP on 3G Fast emulation with the new theme applied.

## Dependencies
- Alignment with design stakeholders on repo-maintained theme tokens per master PRD decision.
- Curated offline brief JSON asset list generated from agreed-upon content scope per master PRD decision.
- Supabase environment variables for runtime configuration of future APIs (placeholder handling defined in dev plan).

## Decisions
1. **Theme token source of truth** — Adopt Option B: maintain tokens directly in the repository (JSON/TypeScript modules feeding Tailwind) to keep implementation and documentation aligned, mirroring changes back to design tools only as needed.
2. **Offline precache scope** — Adopt Option B: ship a curated JSON snapshot of essential brief content with the service worker so judges retain critical information offline while still fetching dynamic updates when connectivity is available.

## Risks & Mitigations
- **Risk:** Service worker update strategy could serve stale theme tokens.
  - **Mitigation:** Implement SW versioning tied to commit hash and prompt users to refresh when a new version activates.
- **Risk:** Performance budget exceeded once additional libraries are added.
  - **Mitigation:** Adopt bundle analysis tooling (e.g., `rollup-plugin-visualizer`) early and enforce lazy loading per route.
- **Risk:** Inconsistent safe-area handling across devices.
  - **Mitigation:** Use CSS env variables with comprehensive testing on device simulators and document behavior in dev plan.

## Metrics
- LCP ≤ 2.2s on 3G Fast for shell routes.
- Install prompt availability on Android Chrome Lighthouse audit.
- Offline load success for shell routes verified via Chrome DevTools offline mode.

