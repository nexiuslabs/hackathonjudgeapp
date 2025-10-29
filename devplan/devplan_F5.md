---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-11
---

# Dev Plan — F5 Comments (Strength & Improvement)

## Architecture & Flow Overview
- Extend the existing scoring route (`src/routes/score/`) to render the comment inputs beneath the slider stack and above the sticky submit bar, ensuring they participate in the autosave context from F4.
- Leverage the autosave provider to watch comment value changes, enqueueing updates alongside score payloads using the shared queue infrastructure.
- When the judge submits the ballot (F6), ensure the submission mutation reads the latest comment values from the autosave store or local React state to send a consistent payload.
- Support read-only mode after final submission or when the ballot is locked, while still displaying previously entered comments for transparency.

## Data & State Management
- Define new fields inside the scoring form state: `commentStrength` and `commentImprovement`, defaulting to empty strings.
- Extend the autosave payload (`AutosaveDraft`) to include `commentStrength` and `commentImprovement` fields that map directly to the Supabase columns (`comment_strength`, `comment_improvement`). Ensure deduplication keys remain unchanged.
- Maintain controlled `Textarea` components bound to React state with debounced updates (`useDebouncedCallback`) feeding the autosave hook to avoid excessive queue churn.
- Persist last-known values in the autosave store so that reloading the scoring view hydrates comment inputs from local drafts or Supabase-sourced drafts when online.
- Track character counts per field in state for live feedback and for accessibility announcements.

## Backend & Migrations
- Add Supabase migration creating nullable `comment_strength` and `comment_improvement` columns on the ballots table (length 1000, text type) along with indexes if query performance requires (likely not initially necessary beyond default row storage).
- Update Supabase types generation so `Database['public']['Tables']['ballots']` reflects the new columns; regenerate TypeScript types via `pnpm supabase types` post-migration.
- Review and adjust RLS policies to confirm judges can only update their own comment columns and that admins retain read access for exports.
- If an autosave staging table exists, ensure it includes the same columns or stores comments within the payload JSON; update any triggers or functions accordingly.

## API & Integration Design
- Update `src/lib/api.ts` mutations responsible for autosave and final submission to send/receive the new comment fields, including TypeScript interfaces.
- Ensure the admin data-fetching utilities (F8) and export builders (F12) are aware of the new fields, even if UI work occurs later—at minimum, expose them via API responses for integration testing.
- Define helper selectors within the autosave context to read/write comment values so components remain decoupled from storage internals.
- Provide a `useCommentFields` hook encapsulating state, character counting, validation rules (max length, trimmed whitespace), and accessibility attributes for reuse in potential future surfaces.

## UI States & UX Messaging
- Build reusable `CommentField` component in `src/components/score/` wrapping Shadcn `Textarea`, label, helper text placeholder, live counter, and error messaging.
- Integrate helper text retrieval by pulling copy from the Supabase-managed content tables with cached fallbacks for offline mode; document temporary hardcoded strings with TODO references if content is not yet published.
- Add safe-area-aware padding to maintain visibility when the virtual keyboard is active; leverage `useSafeAreaInsets` utility if available or extend existing layout primitives.
- Display inline success/error badges tied to autosave status (e.g., "Saved" checkmark) near the character counter for reassurance.
- Respect reduced motion settings when animating focus or helper text transitions.

## Validation & Error Handling
- Allow empty submissions but trim leading/trailing whitespace on change.
- Enforce max length of 1000 characters, showing counter in `current/1000` format; highlight counter in warning color when exceeding 140 guidance and error when hitting the hard cap.
- Surface autosave errors inline with actionable copy, e.g., "We’ll retry when you’re back online" plus manual retry CTA via sticky bar integration.
- On unlock, re-enable fields and repopulate with last saved values from Supabase/autosave to avoid blank states.

## Testing Strategy
- Unit tests for `useCommentFields` ensuring state management, trimming, length validation, and counter behavior work as expected.
- Integration tests for the scoring page verifying comment inputs render, autosave queue receives updates, and read-only mode engages after submission.
- E2E-style tests (Playwright or React Testing Library) simulating mobile viewport to ensure keyboard opening preserves context and focus order remains accessible.
- Snapshot/visual regression tests for comment component across light/dark themes (if applicable) to maintain design consistency.
- Accessibility tests confirming labels, helper text, `aria-live` announcements for counters, and tab order align with WCAG expectations.

## Risks & Mitigations
- **Risk:** Supabase migration may conflict with concurrent schema work.
  - *Mitigation:* Coordinate merge windows, run migrations in staging environment first, and regenerate types immediately.
- **Risk:** Autosave payload size increases causing slower flushes.
  - *Mitigation:* Keep comment fields text-only, compress whitespace, and monitor payload size metrics in telemetry.
- **Risk:** Keyboard interactions may still cause layout shift on certain devices.
  - *Mitigation:* Test on iOS Safari and Chrome Android, adjust viewport meta or scroll handling, and use safe-area utilities.
- **Risk:** Helper text dependency on Supabase content could fail offline.
  - *Mitigation:* Cache helper copy in the PWA shell and provide static fallback strings when content fetch fails.

## Open Items & Follow-ups
- Partner with UX to publish helper text, placeholder copy, and tone guidance into the Supabase content tables and confirm character counter styling requirements are met.
- Confirm with Data/Analytics whether additional telemetry events (`comment_added`, `comment_modified`) are required and log tasks if so.
- Coordinate with F8/F12 owners to ensure admin UI and export templates surface the new fields; create follow-up tasks if gaps remain after implementation review.
