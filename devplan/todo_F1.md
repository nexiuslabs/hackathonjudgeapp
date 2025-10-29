---
owner: Codex Agent
status: draft
last_reviewed: 2024-02-03
---

# TODO — F1 Auth (Magic Link + PIN)

## Clarifications & Inputs
- [x] (Owner: Codex Agent | Due: 2024-02-05) Confirm magic link eligibility whitelist approach with product/ops. — Decision logged: open request form with roster-gated Supabase verification. ↗️ See [Feature PRD — Open Questions #1](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).
- [x] (Owner: Codex Agent | Due: 2024-02-05) Finalize PIN provisioning workflow and length requirements with ops/security. — Decision logged: organizer-assigned single-use PINs with nightly rotation. ↗️ See [Feature PRD — Open Questions #2](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).
- [x] (Owner: Codex Agent | Due: 2024-02-05) Define lost-device recovery flow (self-service vs. organizer intervention) for documentation. — Decision logged: ops console handles resets and reissues. ↗️ See [Feature PRD — Open Questions #3](featurePRD_F1.md#open-questions--recommendations) & [Master PRD](masterPRD.md#feature-specs-mobilefirst).

## Implementation Tasks
- [ ] (Owner: Codex Agent | Due: 2024-02-12) Build `/auth` route with magic link request UI and PIN fallback entry. ↗️ See [Dev Plan — Architecture & Flow Overview](devplan_F1.md#architecture--flow-overview) & [UI Components & UX Details](devplan_F1.md#ui-components--ux-details).
- [ ] (Owner: Codex Agent | Due: 2024-02-12) Extend Supabase integration (API wrappers + context) for session management and instrumentation. ↗️ See [Dev Plan — Data & State Management](devplan_F1.md#data--state-management) & [API & Integration Design](devplan_F1.md#api--integration-design).
- [ ] (Owner: Codex Agent | Due: 2024-02-12) Implement Supabase migration / edge function for PIN verification with rate limiting. ↗️ See [Dev Plan — Backend & Migrations](devplan_F1.md#backend--migrations).
- [ ] (Owner: Codex Agent | Due: 2024-02-13) Develop tests (unit, component, integration, security) covering auth flows. ↗️ See [Dev Plan — Testing Strategy](devplan_F1.md#testing-strategy).
- [ ] (Owner: Codex Agent | Due: 2024-02-13) Document monitoring and fallback guidance for ops team. ↗️ See [Feature PRD — Dependencies](featurePRD_F1.md#dependencies) & [Dev Plan — Open Items & Follow-ups](devplan_F1.md#open-items--follow-ups).

## Follow-ups
- [ ] (Owner: Codex Agent | Due: 2024-02-15) Coordinate with Feature F13 for final RLS and auditing alignment once auth flows are implemented. ↗️ See [Dev Plan — Backend & Migrations](devplan_F1.md#backend--migrations).

