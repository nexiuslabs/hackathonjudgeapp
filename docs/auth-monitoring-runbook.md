# Auth Monitoring & Fallback Runbook

This runbook summarizes day-of operations for Feature F1 (Magic Link + PIN auth). It focuses on monitoring Supabase activity, responding to alerts, and guiding fallback flows when judges encounter issues.

## Dashboards & Alerts
- **Authentication Event Stream (`auth_event_logs`)**  
  - Visualize volume of `magic_link_requested`, `pin_verified`, and `error` events.  
  - Alert threshold: >10 `error` events within 5 minutes or >5 `pin_verified` without corresponding `magic_link_requested`.  
  - Suggested chart: stacked area grouped by `type` with 15-minute interval.
- **PIN Verification Attempts (`pin_verification_attempts`)**  
  - Track rolling failure rate, rate-limit activations, and expired PIN responses.  
  - Alert threshold: failure rate >40% over the last 30 minutes, or >3 `Rate limited` messages per user.  
  - Suggested table: list of emails with last attempt timestamp, success flag, and message.
- **Judge Profile Health (`judge_profiles`)**  
  - Monitor count of `requires_reset = true`, stale `pin_valid_until`, and top repeat offenders (`failed_attempts`).  
  - Alert threshold: any judge with `failed_attempts >= 5` and `last_attempt_at` within 30 minutes.

## Operational Playbooks
### 1. High Failure Rate Alert
1. Confirm Supabase Edge Function status from project logs (`supabase functions logs verify-pin`).
2. Inspect recent entries in `pin_verification_attempts` for shared `message` values (e.g., `PIN expired`).
3. If failures are due to expired codes, generate and distribute a fresh batch of PINs via the ops console.
4. Post status in #judging-ops Slack with summary and ETA for resolution.

### 2. Individual Judge Locked Out
1. Search `pin_verification_attempts` for the judge's email to confirm `Rate limited` or `Invalid PIN` entries.  
2. If rate limited, wait 15 minutes or manually reset via `update judge_profiles set failed_attempts = 0, requires_reset = false where email = ?`.  
3. Issue a new PIN (ensuring `pin_valid_until` is extended) and notify the judge.

### 3. Supabase Outage / Function Failure
1. Reference Supabase status page for ongoing incidents.  
2. If the `verify-pin` function errors, switch to manual fallback:  
   - Confirm judge identity via roster.  
   - Use ops console to mark them as `requires_reset = false` and generate a fresh PIN.  
   - Provide direct scoring sheet access while tracking in the incident log.
3. Notify engineering via PagerDuty if outage exceeds 10 minutes.

## Data Hygiene & Auditing
- Run nightly job (or manual query) to archive `pin_verification_attempts` older than 30 days for compliance.
- Ensure `auth_event_logs` is retained for 90 days to support post-event audits.
- After each event, export summary metrics (login success rate, average attempts per judge) and attach to the retrospective doc.

## Contacts
- **Primary Ops On-Call:** ops-oncall@hackathon.example  
- **Engineering Escalation:** f1-auth-team@hackathon.example  
- **Security:** security@hackathon.example

