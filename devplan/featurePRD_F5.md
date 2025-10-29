---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-11
---

# Feature PRD — F5 Comments (Strength & Improvement)

## Overview & Story
Judges need a lightweight way to capture quick qualitative notes alongside quantitative scores so finalists receive actionable feedback after the event. Feature F5 introduces two optional comment inputs—one highlighting strengths and one detailing improvements—directly within the scoring experience. The flow must preserve the mobile-first ergonomics established in F3 and respect offline/autosave behavior defined in F4 so that notes are never lost even when connectivity fluctuates.

## Goals & Non-Goals
- **Goals**
  - Provide dedicated text inputs for "Strength" and "Improvement" feedback that feel effortless on mobile keyboards and support sentence-case guidance.
  - Keep comments synchronized with autosave and final submission flows so qualitative feedback always ships with the associated ballot.
  - Guide judges toward concise, constructive feedback (~140 characters) while allowing longer entries when necessary.
  - Ensure admins can review, export, and moderate comments without additional tooling.
- **Non-Goals**
  - Building a separate comment moderation queue or notification system (considered post-MVP).
  - Rich text formatting, attachments, or voice-to-text integrations beyond what mobile OS keyboards provide.
  - Advanced analytics on comment sentiment (out of scope for F5).

## User Stories
1. **Judge — quick note:** As a judge, I want to jot down a short strength and improvement note while scoring so I can remember key points during deliberations.
2. **Judge — on the move:** As a judge switching between teams quickly, I need comment fields that stay stable when the keyboard opens and do not force me to scroll away from sliders.
3. **Head Judge/Ops:** As an ops lead, I need submitted comments to appear in exports and the admin console so we can share feedback with finalists after the event.
4. **Accessibility reviewer:** As an accessibility lead, I need comment fields to expose clear labels, helper text, and error messaging compatible with screen readers and keyboard navigation.

## Acceptance Criteria
1. Two labeled textareas (Strength, Improvement) render below the scoring sliders, each supporting at least 500 characters even though 140 is recommended.
2. Inputs display helper text or placeholder copy reinforcing the 140-character guidance and tone expectations once UX provides final language.
3. Fields autosave locally alongside score changes (F4), including offline encryption and queue behavior, and sync to Supabase when online.
4. Final submission payloads (F6) include the latest comments; after submission, fields become read-only unless an unlock is granted.
5. When autosave or submission fails, comment fields surface inline error states and allow retry without data loss.
6. Mobile keyboard focus keeps the input anchored with minimal viewport jump, respecting safe areas and avoiding layout shift.
7. Comments appear in judge/admin review surfaces (e.g., admin console detail panel, exports) in coordination with downstream features.
8. Accessibility: labels associate with inputs, helper/error text uses `aria-describedby`, and character count feedback is announced to assistive tech.

## Dependencies
- **F3** scoring UI placement and interactions.
- **F4** autosave pipeline for persisting draft comments.
- **F6** submission/locking rules to finalize comment values.
- Supabase schema updates to store comment fields with ballots.
- Admin console features (F8) and export pipelines (F12) to display comments.

## Decisions & Rationale
1. **Placement:** Embed comment fields directly below the scoring sliders and above the sticky submit bar to keep them within thumb reach while maintaining the scoring context.
2. **Input component:** Use a reusable Shadcn `Textarea` variant with Tailwind utility classes tuned for mobile, ensuring consistent styling and focus states across the app.
3. **Autosave integration:** Extend the autosave payload schema to include comment values, leveraging existing queue encryption and deduplication logic so no new storage surface is required.
4. **Validation:** Keep fields optional but enforce a 1,000-character hard limit to prevent runaway inputs and maintain database performance.
5. **Comment storage shape:** Store Strength and Improvement feedback as dedicated Supabase columns (`comment_strength`, `comment_improvement`) to keep exports simple and avoid JSON parsing overhead.
6. **Helper text sourcing:** Fetch helper and placeholder copy from Supabase-managed content so UX can iterate without code changes, while providing cached fallbacks for offline resilience.
7. **Character count affordance:** Display a live character counter with `aria-live` support to guide judges toward the 140-character target and surface the 1,000-character cap proactively.

## Risks & Mitigations
- **Risk:** Judges may ignore comment fields, reducing qualitative insights.
  - *Mitigation:* Provide microcopy emphasizing the value of notes and consider soft reminders in the sticky bar when left blank near submission (without making them required).
- **Risk:** Keyboard focus could obscure submit controls.
  - *Mitigation:* Implement scroll-into-view logic and safe-area padding, and test across iOS Safari and Chrome Android.
- **Risk:** Autosave conflicts might overwrite newer comments.
  - *Mitigation:* Timestamp comment updates and ensure deduplication uses the latest `updated_at`, mirroring F4 behavior.
- **Risk:** Sensitive content stored without moderation.
  - *Mitigation:* Flag future need for moderation in F8/F12 scopes and document appropriate usage guidelines for judges.

## Success Metrics
- ≥80% of submitted ballots include at least one comment once UX guidance is finalized.
- 0 reports of lost comment data during offline/online transitions in pilot tests.
- Accessibility testing confirms screen readers announce labels, helper text, and character counts with WCAG 2.1 AA compliance.
- Admin export QA validates comments appear correctly in CSV/PDF outputs without truncation.
