---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-03
---

# Feature PRD — F1 Auth (Magic Link + PIN)

## Overview & Story
Judges and organizers need a frictionless yet secure authentication flow that works on mobile devices under tight event timelines. This feature introduces a two-step login experience that prioritizes magic links for low-friction access while providing an on-site PIN fallback for connectivity or device issues. The solution must respect the mobile-first design mandates, operate reliably on spotty networks, and preserve session continuity throughout the finals day.

## Goals & Non-Goals
- **Goals**
  - Deliver a magic-link login that allows authorized judges to enter the scoring experience within two primary interactions from the landing screen.
  - Provide a numeric PIN fallback optimized for touch devices with auto-focus, one-tap keypad, and clear error handling.
  - Persist sessions through finals day with automatic reconnection handling after transient connectivity loss.
  - Instrument authentication flows for monitoring (success, failures, fallbacks) to support day-of operations.
- **Non-Goals**
  - Implement organizer-facing user provisioning interfaces beyond necessary API endpoints or scripts.
  - Build multi-factor authentication beyond the documented magic link + PIN combination.
  - Deliver complete RBAC enforcement across admin surfaces (covered under Feature F13).

## User Stories
1. **Judge (primary path):** As an invited judge, I want to open the email magic link on my phone and land directly in the scoring app with confirmation that my session is active, so I can start evaluating teams immediately.
2. **Judge (fallback):** As a judge who cannot access email during the event, I want to enter a short numeric PIN provided on-site so that I can regain access without waiting for organizer intervention.
3. **Head Judge / Ops:** As an organizer, I want visibility into judge login status (magic link vs. PIN) so that I can troubleshoot access issues before judging begins.

## Acceptance Criteria
1. Magic-link flow delivers authenticated sessions that persist for the finals day without requiring repeated logins after app refresh or temporary offline events.
2. PIN entry screen uses a numeric keypad, auto-focus behavior, and accessible labels, and allows retry with rate limiting and error toasts on failure.
3. Upon successful login (magic link or PIN), the app routes the judge to the `/score` surface with context for the active event.
4. Authentication failures present actionable messaging and link to contact support, without revealing sensitive status (e.g., whether an email exists).
5. Session state persists locally (secure storage) with automatic revalidation when the app regains connectivity.
6. Instrumentation captures login attempts, success/failure counts, and fallback usage, exposed via logging or Supabase table for day-of monitoring.

## Dependencies
- Supabase Auth configuration supporting magic-link email sign-in and custom verification templates aligned with event branding.
- Judge roster dataset including email addresses and fallback PIN metadata (length, validity window) from operations tooling.
- Feature F0 shell routing and layout components to host the auth flow and post-login redirect.
- Security policies from Feature F13 for final RBAC enforcement and auditing.

## Open Questions & Recommendations
1. **Magic link eligibility source**
   - *Option A:* Allow any email domain to request a link, validating against Supabase user records only at sign-in.
   - *Option B:* Restrict requests to a pre-uploaded whitelist per event, rejecting others upfront.
   - **Decision:** Option A — keeps the entry point simple for judges while relying on Supabase to accept only pre-provisioned accounts, ensuring roster control without extra UI friction.
2. **PIN provisioning model**
   - *Option A:* Judges set their own PIN after first magic-link login.
   - *Option B:* Organizers assign one-time PINs distributed on-site (paper/secure channel).
   - **Decision:** Option B — organizers issue single-use codes with controlled rotation, avoiding additional setup UI and aligning with ops readiness.
3. **Lost-device recovery flow**
   - *Option A:* Allow re-requesting magic link from the login screen with re-authentication.
   - *Option B:* Provide organizer-managed reset panel to invalidate existing sessions and issue new link/PIN.
   - **Decision:** Option B — centralize recovery through the organizer console so ops can revoke compromised sessions and issue replacements immediately.

## Risks & Mitigations
- **Risk:** Magic-link emails get delayed on venue Wi-Fi causing login bottlenecks.
  - *Mitigation:* Send pre-event links and cache locally; ensure PIN fallback works offline once validated.
- **Risk:** PIN brute-force attempts compromise security.
  - *Mitigation:* Enforce rate limiting and lockouts after repeated failures; log attempts for monitoring.
- **Risk:** Session persistence conflicts with Supabase TTL leading to unexpected logouts.
  - *Mitigation:* Align Supabase session expiry with finals schedule and implement silent refresh logic.

## Success Metrics
- ≥95% of judges complete login within two attempts on the primary magic-link flow.
- <1% of logins require organizer intervention post-fallback.
- Zero unauthorized access incidents recorded in Supabase audit logs during finals.

