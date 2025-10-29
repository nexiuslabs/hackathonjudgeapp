---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-02
---

# Dev Plan — F0 Platform, Theme, PWA Shell

## Architecture & Design Overview
- Bootstrap Tailwind theme tokens via `tailwind.config.js`, mapping brand palette, spacing scale, typography, and radii to align with the recommended in-repo source of truth.
- Establish global layout components in `src/components/layout/` (e.g., `AppShell`, `SafeAreaContainer`) using Shadcn/UI primitives extended with Tailwind classes.
- Configure React Router with routes for `/brief`, `/score`, and `/admin`, each loading lightweight placeholder pages demonstrating the new theme.
- Implement safe-area handling with CSS custom properties and utility classes applied to navigation and key interactive regions.

## Data & State
- Introduce a `src/config/theme-tokens.ts` module exporting token definitions consumed by both Tailwind (via plugin) and runtime components.
- Create a lightweight `src/config/offline-content.ts` placeholder to host the curated JSON snapshot pending confirmation of precached assets.
- Centralize app metadata (name, short_name, descriptions) in a config file consumed by both manifest generation and service worker messaging.

## Migrations & Backend Touchpoints
- No database migrations expected for this feature.
- Supabase interaction limited to ensuring environment placeholders exist (documented in README if required) without executing API calls.

## PWA Implementation Strategy
- Generate `public/manifest.webmanifest` with icons referencing `/public/icons/*` assets; include theme_color/background_color aligned with token palette.
- Implement a custom service worker via Vite's `workbox` plugin (or `vite-plugin-pwa`) configured for `CacheFirst` on shell assets and `StaleWhileRevalidate` for the offline content snapshot.
- Define versioning strategy using a build timestamp or git hash injected at build time to trigger SW updates.

## Testing Strategy
- Unit test theme token exports to ensure keys exist and match Tailwind config (Jest/vitest snapshot).
- Integration tests rendering `AppShell` to confirm safe-area padding and responsive breakpoints using React Testing Library with `jsdom` viewport mocks.
- End-to-end smoke via Playwright (or Cypress) verifying installability (manifest link) and offline fallback (service worker intercept) — mark as TODO in todo list pending tooling setup.
- Performance budget checks using `pnpm run build` + `pnpm run analyze` (to be defined) monitored by CI.

## Accessibility & UX Considerations
- Ensure base font sizes default to 16px and all global interactive components maintain 44px minimum size.
- Provide focus outlines and reduced-motion respect via CSS global styles.
- Document keyboard navigation expectations for placeholder pages.

## Risks & Mitigations
- **Token Drift:** Without a central config, Tailwind and runtime components may diverge.
  - *Mitigation:* Generate tokens from a single `theme-tokens` module and import into Tailwind via `tsconfig.json` path alias.
- **Service Worker Complexity:** Misconfiguration could block dev builds.
  - *Mitigation:* Use `vite-plugin-pwa` with dev-friendly mode toggled off by default; provide README instructions for local testing.
- **Bundle Size Growth:** Early addition of component libraries may exceed budget.
  - *Mitigation:* Evaluate component imports and rely on tree-shakeable Shadcn components; add bundle analyzer in tooling tasks.

## Open Items & Follow-ups
- Theme tokens will live in `src/config/theme-tokens.ts` as the repo source of truth with Tailwind consuming the same definitions; mirror updates back to design tools when shared.
- Precache payload will include `src/config/offline-brief.json` generated during build to provide essential brief content offline, with dynamic updates fetched when online.
- Need final icon assets (512/192/96) from design; placeholder generated icons acceptable until brand assets delivered.

