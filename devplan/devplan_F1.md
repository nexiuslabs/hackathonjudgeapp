---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-03
---

# Dev Plan — F1 Auth (Magic Link + PIN)

## Architecture & Flow Overview
- Introduce an authentication landing route (`/auth`) rendered within the existing shell from F0, presenting two primary actions: request magic link and enter PIN.
- Implement React Query-powered API hooks in `src/lib/api.ts` for magic link requests, PIN verification, and session refresh aligned with Supabase Auth endpoints.
- Use Shadcn/UI components to build reusable form pieces (`EmailMagicLinkForm`, `PinEntryPad`, `AuthStatusBanner`) inside `src/components/auth/` to maintain consistency and accessibility.
- After successful authentication, update a central `AuthContext` (existing or to be created) to store Supabase session data and navigate to `/score` with event context.

## Data & State Management
- Leverage Supabase Auth client for session management, persisting tokens in secure local storage via Supabase JS SDK defaults while wrapping with additional guards for finals-day TTL.
- Store judge profile metadata (event ID, allowed surfaces, fallback PIN hash) in a Supabase table (e.g., `judge_profiles`) retrieved post-login via RPC or REST call.
- Maintain local UI state for PIN entry attempts, cooldown timers, and offline banners using Zustand or React context to avoid prop drilling.

## Backend & Migrations
- Add Supabase migration to create/extend `judge_profiles` table with fields: `user_id`, `event_id`, `pin_hash`, `pin_salt`, `pin_valid_until`, `requires_reset`, and audit timestamps.
- Define edge function or RPC for verifying PINs that enforces rate limiting and logs attempts; design to operate offline-first by caching successful validation token when device disconnects.
- Coordinate with Feature F13 for RLS policies ensuring only authorized service roles can access PIN hashes and audit logs.

## API & Integration Design
- Extend `src/lib/api.ts` with functions: `requestMagicLink(email, eventId)`, `verifyPin(pin, emailOrCode)`, `getSession()`, `refreshSession()`, and `logAuthEvent(payload)`.
- Implement Supabase Edge Function `verify-pin` (if required) to check hashed PIN server-side; respond with short-lived session token to be exchanged via Supabase Auth.
- Configure email template customization (Supabase) to include event branding and fallback guidance.

## UI Components & UX Details
- `EmailMagicLinkForm`: email input with domain validation, event selection (hidden or pre-filled), inline helper text, loading state, success toast with instructions.
- `PinEntryPad`: 4-6 digit keypad component with large buttons, haptic-friendly feedback, focus trap, accessible labels, and error toasts.
- `AuthStatusBanner`: shows current session status, offline indicator, and button to refresh session or log out.
- Provide onboarding tooltips explaining fallback options and expected response times.

## Testing Strategy
- Unit tests for `requestMagicLink` and `verifyPin` API wrappers using mocked Supabase clients verifying payloads and error handling.
- Component tests for `EmailMagicLinkForm` and `PinEntryPad` ensuring accessibility attributes, focus management, and error messaging (React Testing Library + Jest/Vitest).
- Integration test simulating full login flow (magic link stub + PIN fallback) verifying redirect to `/score` and persisted session context.
- Security tests covering rate limiting, lockout behavior after repeated PIN failures, and ensuring PIN input never logs raw digits.

## Risks & Mitigations
- **Risk:** Supabase throttles email dispatch due to event volume.
  - *Mitigation:* Queue pre-event sending, implement exponential backoff, and monitor API quotas.
- **Risk:** Offline judges cannot validate PIN if network is down.
  - *Mitigation:* Cache last-known validated session locally for limited offline use, with banner indicating offline status and sync retry.
- **Risk:** Complex state synchronization between Supabase session refresh and UI context leads to stale data.
  - *Mitigation:* Centralize session updates in context hook with event-driven updates and background refresh intervals.

## Open Items & Follow-ups
- Update copy and flows to reflect final decisions: open magic-link requests with roster-gated verification, organizer-assigned single-use PINs, and ops-managed lost-device recovery panel.
- Coordinate with Ops team to define monitoring dashboard/tables for login metrics captured via `logAuthEvent` pipeline.
- Determine whether to bundle Supabase OTP SMS as future enhancement; currently out of scope but note for backlog.

