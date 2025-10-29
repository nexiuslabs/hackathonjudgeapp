---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-07
---

# Feature PRD — F3 Judge Scoring UI (Sliders 1–10)

## Overview & Story
Judges need a rapid, reliable interface to record scores for each finalist team using four evaluation criteria while working primarily from their phones. Feature F3 delivers a thumb-friendly scoring canvas with large sliders, inline guidance that reinforces what each score means, and a sticky submit bar that keeps the primary action visible at all times. The experience must integrate with authentication from F1, respect mobile ergonomics, preview the weighted total in real time, and gracefully handle offline scenarios in conjunction with F4.

## Goals & Non-Goals
- **Goals**
  - Present four scoring sliders with descriptive helper text and contextual cues that match the judging brief and educate new judges.
  - Keep the submit controls persistently available via a sticky footer bar that reflects validation status and connectivity state.
  - Preview a running total that reflects official weighting rules so judges understand the impact of each adjustment.
  - Provide onboarding aids, error states, and confirmation feedback tailored for one-handed use on small screens.
- **Non-Goals**
  - Implement autosave, offline queueing, or final submission locking mechanics (covered by Features F4 and F6).
  - Capture qualitative feedback/comments (Feature F5) or tie-breaking workflows (Feature F11).
  - Design admin-only scoring override interfaces (reserved for future admin console work in F8/F15).

## User Stories
1. **Primary Judge — scoring in-session:** As a judge holding my phone in one hand, I want to adjust four sliders with clear descriptions so I can confidently assign accurate scores without mis-taps.
2. **Judge — verifying totals:** As a judge, I want to see the weighted total update instantly as I tweak individual scores so I understand how my ratings contribute to the final result before submitting.
3. **Accessibility reviewer:** As an accessibility lead, I need all scoring controls to be operable via keyboard and screen reader so judges using assistive tech can score without barriers.
4. **Head Judge:** As the head judge monitoring submissions, I want the scoring UI to prevent accidental submissions and surface validation clearly so I can trust the data integrity.

## Acceptance Criteria
1. Four sliders render vertically in a single column on mobile, each labeled with the criterion name, numeric value display, and "what good looks like" helper text sourced from the judging brief content.
2. Sliders allow integer values 1–10 with large, thumb-friendly hit areas (≥44px) and keyboard controls that step values predictably; focus states are visible and accessible.
3. The sticky submit bar remains visible while scrolling, showing current total, validation state (e.g., incomplete, ready, offline), and providing primary and secondary actions per design system.
4. The total preview updates within 100ms of slider adjustments using the confirmed weighting rules and includes explanatory copy for how totals are calculated.
5. Attempting to submit without all criteria scored surfaces inline validation messaging near the relevant slider and in the sticky bar; the submit action is disabled until resolved.
6. Loading, empty (no assigned criteria), and error states appear with actionable guidance; skeleton or shimmer placeholders show while fetching criterion metadata.
7. Screen reader announcements follow ARIA best practices (e.g., `aria-valuenow`, descriptive labels) and the flow maintains logical tab order without trapping focus.

## Dependencies
- Feature F1 for authenticated access and active judge/session context.
- Feature F4 for autosave and offline queue integration that will plug into the sticky submit bar status messaging.
- Feature F5 for qualitative feedback integration that may sit adjacent to or below the sliders.
- Supabase data models defining scoring criteria metadata (names, descriptions, weighting) and storing judge scores.
- Decisions captured in `devplan/masterPRD.md` TODOs regarding slider labels, weighting, and default state behavior.

## Decisions & Rationale
1. **Criterion labels/source of truth** — We will source labels and helper copy directly from the judging brief Supabase tables to preserve a single source of truth while leveraging caching strategies to keep loads fast.
2. **Total weighting logic** — The total preview will reflect the official per-criterion weights supplied by ScoringOps so the UI matches backend calculations without reconciliation drift.
3. **Slider default state** — Sliders will render without a preset value and require an explicit first interaction, minimizing accidental submissions while still supporting quick adjustments.

## Risks & Mitigations
- **Risk:** Judges accidentally change scores while scrolling.
  - *Mitigation:* Implement vertical spacing, require deliberate drag with increased grip threshold, and optionally provide an undo toast after submission.
- **Risk:** Weighted total calculations diverge from backend logic.
  - *Mitigation:* Centralize weighting constants in a shared config module and add unit tests validating totals against fixture data.
- **Risk:** Screen readers misinterpret slider semantics.
  - *Mitigation:* Use native input range semantics or accessible slider components from the shared UI library with verified ARIA labels and keyboard handling.

## Success Metrics
- Judges can complete scoring for a team (all four sliders + submission) in ≤90 seconds during usability tests.
- ≥95% of judges report confidence in the total preview accuracy in post-event surveys.
- No more than 1% of scoring sessions trigger validation errors related to incomplete sliders after the first submission attempt.
