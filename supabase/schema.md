# AI-IGNITION 2025 Finals Scoring App - Database Schema

**Version:** 2.0
**Last Updated:** 2025-10-29
**Database:** Supabase PostgreSQL (ap-southeast-1)

---

## Overview

This document describes the complete database schema for the AI-IGNITION 2025 Finals Scoring App, including all tables, views, materialized views, RPC functions, and security policies.

---

## Core Tables

### 1. events

Stores event configuration and global settings.

**Columns:**
- `id` (text, PK) - Event identifier (e.g., '2025-finals')
- `name` (text, NOT NULL) - Human-readable event name
- `description` (text) - Event description
- `rankings_unlocked_at` (timestamptz) - When rankings were unlocked for judges
- `rankings_auto_unlock` (boolean, default: true) - Auto-unlock when all judges complete
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())
- `metadata` (jsonb, default: {}) - Additional event configuration

**RLS:** Read: public | Write: service_role only

---

### 2. teams

Stores team information for each event.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL) - References event
- `team_name` (text, NOT NULL) - Team display name
- `problem_track` (text) - Problem category/track
- `presentation_order` (integer) - Presentation sequence
- `is_finalist` (boolean, default: false) - Finalist flag
- `metadata` (jsonb, default: {}) - Additional team data
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**Indexes:**
- Composite unique: (event_id, team_name)

**RLS:** Read: public | Write: service_role only

---

### 3. judges

Public judge profiles for display in Brief page.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `user_id` (uuid) - References auth.users
- `full_name` (text, NOT NULL)
- `bio` (text)
- `headshot_url` (text)
- `is_published` (boolean, default: false)
- `display_order` (integer)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**RLS:** Read: public if is_published | Write: service_role only

---

### 4. judge_profiles

Secure judge authentication profiles with PIN credentials.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `user_id` (uuid) - References auth.users
- `event_id` (text, NOT NULL)
- `pin_hash` (text, NOT NULL) - Hashed PIN for authentication
- `pin_salt` (text, NOT NULL) - Salt for PIN hashing
- `pin_valid_until` (timestamptz, NOT NULL) - PIN expiration
- `requires_reset` (boolean, default: false) - Force PIN reset flag
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())
- `last_login_at` (timestamptz)

**Indexes:**
- Composite unique: (user_id, event_id)

**RLS:** Judges can read own profile | Write: service_role only

---

### 5. scoring_criteria

Defines scoring rubric for each event.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `criterion_id` (text, NOT NULL) - Unique criterion identifier
- `label` (text, NOT NULL) - Display label
- `helper_copy` (text) - Helper text for judges
- `weight` (numeric, NOT NULL, 0-1) - Criterion weight in total score
- `default_value` (numeric) - Default slider value
- `ordering` (integer, default: 0) - Display order
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**Constraints:**
- CHECK: weight >= 0 AND weight <= 1

**Indexes:**
- Composite unique: (event_id, criterion_id)

**RLS:** Read: public | Write: service_role only

---

### 6. autosave_ballots

Stores judge ballots with autosave and locking support.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `judge_profile_id` (uuid) - References judge_profiles
- `team_id` (uuid) - References teams
- `payload` (jsonb, default: {}) - Scores and form state
- `comment_strength` (text, max 1000 chars) - What went well
- `comment_improvement` (text, max 1000 chars) - What to improve
- `is_locked` (boolean, default: false) - Submission lock flag
- `locked_at` (timestamptz) - When ballot was submitted
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**Constraints:**
- Composite unique: (event_id, judge_profile_id, team_id)
- CHECK: length(comment_strength) <= 1000
- CHECK: length(comment_improvement) <= 1000

**RLS:** Judges can read/write own ballots | Admins read all

---

### 7. ballot_unlock_requests

Manages unlock request workflow for locked ballots.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `ballot_id` (uuid) - References autosave_ballots ON DELETE CASCADE
- `judge_profile_id` (uuid) - References judge_profiles ON DELETE CASCADE
- `event_id` (text, NOT NULL)
- `team_id` (uuid) - References teams ON DELETE CASCADE
- `reason` (text) - Judge's reason for unlock
- `status` (text, default: 'pending') - pending | approved | rejected
- `created_at` (timestamptz, default: now())
- `resolved_at` (timestamptz) - When request was handled
- `resolved_by` (uuid) - References auth.users (admin who handled)
- `resolution_notes` (text) - Admin notes

**Constraints:**
- CHECK: status IN ('pending', 'approved', 'rejected')
- Partial unique index: (ballot_id) WHERE status = 'pending'

**RLS:** Judges can insert/read own requests | Admins read/update all

---

### 8. ballot_audit

Comprehensive audit trail for all ballot lifecycle actions.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `ballot_id` (uuid) - References autosave_ballots ON DELETE CASCADE
- `judge_profile_id` (uuid) - References judge_profiles ON DELETE CASCADE
- `event_id` (text, NOT NULL)
- `team_id` (uuid) - References teams ON DELETE CASCADE
- `action` (text, NOT NULL) - Action type
- `metadata` (jsonb, default: {}) - Action context
- `created_at` (timestamptz, default: now())
- `created_by` (uuid) - References auth.users

**Action Types:**
- `submitted` - Ballot locked/submitted
- `unlock_requested` - Judge requested unlock
- `unlock_approved` - Admin approved unlock
- `unlock_rejected` - Admin rejected unlock
- `unlock_revoked` - Admin revoked lock

**Constraints:**
- CHECK: action IN ('submitted', 'unlock_requested', 'unlock_approved', 'unlock_rejected', 'unlock_revoked')

**Indexes:**
- (ballot_id, created_at DESC)
- (event_id, created_at DESC)

**RLS:** Judges read own ballot audits | Service role only for writes

---

### 9. admin_timer_state

Event timer management for admin console.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, UNIQUE, NOT NULL)
- `mode` (text, default: 'idle') - idle | running | paused
- `remaining_seconds` (integer, default: 0, >= 0)
- `total_seconds` (integer, default: 0, >= 0)
- `started_at` (timestamptz) - When timer started
- `paused_at` (timestamptz) - When timer paused
- `control_owner` (uuid) - References auth.users (admin who controls)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**Constraints:**
- CHECK: mode IN ('idle', 'running', 'paused')
- CHECK: remaining_seconds >= 0
- CHECK: total_seconds >= 0

**RLS:** Service role only

---

### 10. brief_content

Stores dynamic content for the Brief page.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, UNIQUE, NOT NULL)
- `sections` (jsonb, default: {}) - Brief sections content
- `is_published` (boolean, default: false)
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**RLS:** Read: public if is_published | Write: service_role only

---

### 11. scores (Legacy)

Original per-criterion score table (kept for migration compatibility).

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `team_id` (uuid) - References teams
- `judge_profile_id` (uuid) - References judge_profiles
- `criterion_id` (text, NOT NULL)
- `score_value` (numeric, NOT NULL)
- `comment` (text)
- `submitted_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now())

**Note:** Modern scoring uses autosave_ballots.payload. This table is retained for backward compatibility.

---

### 12. pin_verification_attempts

Tracks PIN authentication attempts for security monitoring.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `judge_profile_id` (uuid) - References judge_profiles ON DELETE CASCADE
- `attempt_timestamp` (timestamptz, default: now())
- `success` (boolean, NOT NULL)
- `ip_address` (text)
- `user_agent` (text)
- `failure_reason` (text)

**RLS:** Service role only

---

### 13. rankings_refresh_log

Realtime notification log for rankings updates.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `refreshed_at` (timestamptz, default: now())

**Purpose:** Clients subscribe to this table to know when to refetch rankings.

**RLS:** Read: public | Write: service_role only

---

### 14. progress_refresh_log

Realtime notification log for admin progress view updates.

**Columns:**
- `id` (uuid, PK, default: gen_random_uuid())
- `event_id` (text, NOT NULL)
- `refreshed_at` (timestamptz, default: now())

**Purpose:** Admin console subscribes to this table for progress matrix updates.

**RLS:** Service role only

---

## Views and Materialized Views

### 1. finalists_view

Public view of finalist teams for Brief page display.

**Columns:**
- `id` (uuid)
- `event_id` (text)
- `team_name` (text)
- `problem_track` (text)
- `presentation_order` (integer)
- `metadata` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Source:** `SELECT * FROM teams WHERE is_finalist = true`

---

### 2. judges_view

Public view of published judges for Brief page display.

**Columns:**
- `id` (uuid)
- `event_id` (text)
- `full_name` (text)
- `bio` (text)
- `headshot_url` (text)
- `display_order` (integer)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Source:** `SELECT * FROM judges WHERE is_published = true ORDER BY display_order`

---

### 3. ballot_unlock_requests_admin

Admin-friendly view with handler field aliases.

**Columns:**
- `id` (uuid)
- `ballot_id` (uuid)
- `judge_profile_id` (uuid)
- `event_id` (text)
- `team_id` (uuid)
- `reason` (text)
- `status` (text)
- `created_at` (timestamptz)
- `handled_at` (timestamptz) - Alias for resolved_at
- `handled_by` (uuid) - Alias for resolved_by
- `notes` (text) - Alias for resolution_notes

---

### 4. rankings_materialized (Materialized View)

Aggregated rankings with weighted scores and per-criterion breakdowns.

**Columns:**
- `event_id` (text)
- `team_id` (uuid)
- `team_name` (text)
- `total_score` (numeric) - Weighted average (0-100 scale)
- `rank` (integer) - Current ranking position
- `delta_to_prev` (numeric) - Score difference from previous rank
- `submitted_count` (bigint) - Number of judges who scored
- `criterion_scores` (jsonb) - Array of per-criterion averages with labels and weights

**Refresh Strategy:**
- Automatically refreshed via trigger on autosave_ballots changes
- REFRESH MATERIALIZED VIEW CONCURRENTLY for non-blocking updates

**Indexes:**
- UNIQUE: (event_id, team_id)
- (event_id, rank)

---

### 5. event_judge_progress_view (Materialized View)

Judge × Team progress matrix for admin console.

**Columns:**
- `event_id` (text)
- `judge_profile_id` (uuid)
- `judge_name` (text) - Display name or fallback
- `team_id` (uuid)
- `team_name` (text)
- `status` (text) - not_started | in_progress | submitted
- `last_updated` (timestamptz) - Last ballot activity
- `criteria_completed` (bigint) - Number of criteria scored

**Refresh Strategy:**
- Automatically refreshed via trigger on autosave_ballots changes
- REFRESH MATERIALIZED VIEW CONCURRENTLY

**Indexes:**
- (event_id, judge_profile_id)
- (event_id, team_id)
- (event_id, status)

**RLS:** Service role only

---

## RPC Functions

### Authentication & PIN Management

#### `verify_judge_pin(p_event_id text, p_pin text)`
Verifies judge PIN and returns session token.

**Returns:** jsonb
**Security:** SECURITY DEFINER

---

### Ballot Management

#### `autosave_ballot(p_event_id text, p_team_id uuid, p_payload jsonb, p_comment_strength text, p_comment_improvement text)`
Autosaves ballot progress (idempotent).

**Returns:** jsonb
**Security:** SECURITY DEFINER

---

#### `submit_ballot(p_event_id text, p_team_id uuid, p_payload jsonb, p_comment_strength text, p_comment_improvement text)`
Submits and locks ballot with audit trail (idempotent for offline sync).

**Returns:** jsonb with `was_already_submitted` flag
**Security:** SECURITY DEFINER

---

### Unlock Request Workflow

#### `request_unlock(p_event_id text, p_team_id uuid, p_reason text)`
Creates unlock request and audit record in single transaction.

**Returns:** jsonb with request_id and status
**Security:** SECURITY DEFINER

---

#### `approve_unlock_request(p_request_id uuid, p_resolution_notes text)`
Admin function to approve unlock, unlock ballot, and create audit.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

#### `reject_unlock_request(p_request_id uuid, p_resolution_notes text)`
Admin function to reject unlock request with audit.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

### Rankings Management

#### `get_rankings(p_event_id text)`
Returns rankings with server-side gating enforcement.

**Returns:** TABLE with ranking data + unlock status
**Security:** SECURITY DEFINER
**Gating:** Returns empty if rankings locked (unless admin)

---

#### `unlock_rankings(p_event_id text)`
Manually unlocks rankings for event (admin override).

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

#### `check_rankings_auto_unlock(p_event_id text)`
Checks completion and auto-unlocks if threshold met.

**Returns:** jsonb with trigger status
**Security:** SECURITY DEFINER

---

### Admin Console

#### `get_judge_progress(p_event_id text)`
Returns complete judge × team progress matrix.

**Returns:** TABLE with progress data
**Security:** SECURITY DEFINER (admin only)

---

#### `get_judge_criterion_detail(p_event_id text, p_judge_profile_id uuid, p_team_id uuid)`
Returns per-criterion drill-in detail for admin review.

**Returns:** jsonb with criterion scores and comments
**Security:** SECURITY DEFINER (admin only)

---

### Timer Management

#### `start_timer(p_event_id text, p_duration_seconds integer)`
Starts event timer.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

#### `pause_timer(p_event_id text)`
Pauses running timer with elapsed calculation.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

#### `resume_timer(p_event_id text)`
Resumes paused timer.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

#### `reset_timer(p_event_id text)`
Resets timer to initial state.

**Returns:** jsonb
**Security:** SECURITY DEFINER (admin only)

---

### Event Control

#### `lock_event(p_event_id text)`
Bulk locks all unlocked ballots with audit trail.

**Returns:** jsonb with count of locked ballots
**Security:** SECURITY DEFINER (admin only)

---

#### `unlock_event(p_event_id text)`
Emergency bulk unlock of all ballots with audit trail.

**Returns:** jsonb with count of unlocked ballots
**Security:** SECURITY DEFINER (admin only)

---

## Triggers

### 1. refresh_rankings_on_ballot_submit

**Trigger on:** autosave_ballots (AFTER INSERT OR UPDATE)
**Function:** trigger_rankings_refresh()

**Actions:**
1. Refreshes rankings_materialized view
2. Inserts record into rankings_refresh_log for realtime notification
3. Calls check_rankings_auto_unlock() to check completion threshold

---

### 2. refresh_progress_on_ballot_change

**Trigger on:** autosave_ballots (AFTER INSERT OR UPDATE OR DELETE)
**Function:** trigger_progress_refresh()

**Actions:**
1. Refreshes event_judge_progress_view
2. Inserts record into progress_refresh_log for realtime notification

---

## Security Summary

### Row Level Security (RLS)

All tables have RLS enabled. Policies enforce:

1. **Public Read Access:**
   - events (read-only)
   - teams (read-only)
   - judges (is_published only)
   - brief_content (is_published only)
   - scoring_criteria (read-only)

2. **Judge Access:**
   - Own judge_profile (read)
   - Own autosave_ballots (read/write)
   - Own ballot_unlock_requests (insert/read)
   - Own ballot_audit records (read)

3. **Admin-Only Access (service_role):**
   - All tables (write)
   - admin_timer_state (all)
   - ballot_unlock_requests (update)
   - event_judge_progress_view (read)
   - All admin RPC functions

### Audit Trail

Every sensitive operation creates audit records in:
- `ballot_audit` - All ballot lifecycle events
- `pin_verification_attempts` - Authentication attempts
- `rankings_refresh_log` - Rankings refresh events
- `progress_refresh_log` - Progress view updates

---

## Data Flow

### Scoring Flow
1. Judge loads ScorePage → reads from autosave_ballots
2. Judge adjusts sliders → autosave_ballot() upserts to autosave_ballots
3. Judge submits → submit_ballot() locks ballot, creates audit record
4. Trigger refreshes rankings_materialized and checks auto-unlock

### Unlock Flow
1. Judge requests unlock → request_unlock() creates request + audit
2. Admin reviews → approve_unlock_request() unlocks ballot + audit
3. Judge can now edit → autosave_ballot() writes to unlocked ballot

### Rankings Flow
1. Ballot submitted → trigger refreshes rankings_materialized
2. Trigger checks if all judges complete → auto-unlocks if threshold met
3. Trigger inserts rankings_refresh_log → realtime notification
4. Clients call get_rankings() → server enforces gating

### Admin Console Flow
1. Ballot changes → trigger refreshes event_judge_progress_view
2. Trigger inserts progress_refresh_log → realtime notification
3. Admin calls get_judge_progress() → receives matrix
4. Admin drills in → get_judge_criterion_detail() returns detail

---

## Indexes Summary

### Performance-Critical Indexes

1. **autosave_ballots:**
   - Composite unique: (event_id, judge_profile_id, team_id)
   - (event_id, is_locked)

2. **ballot_audit:**
   - (ballot_id, created_at DESC)
   - (event_id, created_at DESC)

3. **ballot_unlock_requests:**
   - (event_id, status)
   - (judge_profile_id, status)
   - Partial unique: (ballot_id) WHERE status = 'pending'

4. **rankings_materialized:**
   - UNIQUE: (event_id, team_id)
   - (event_id, rank)

5. **event_judge_progress_view:**
   - (event_id, judge_profile_id)
   - (event_id, team_id)
   - (event_id, status)

---

## Migration History

See `supabase/migrations/` directory for full migration history:

1. **20251029095435** - Create brief content and views
2. **20251029095740** - Create scoring system
3. **20251029100121** - Create autosave ballots
4. **20251029100439** - Add comment columns to ballots
5. **20251029100935** - Create ballot unlock and audit system
6. **20251029105347** - Create rankings system with gating
7. **20251029121132** - Create admin console backend

---

## TypeScript Types

Generated TypeScript types are maintained in:
- `src/types/database.types.ts`

To regenerate types after schema changes:
```bash
pnpm supabase types
```

---

## Best Practices

### For Developers

1. **Always use RPC functions** for complex operations (don't bypass business logic)
2. **Never bypass RLS** in application code
3. **Use materialized views** for expensive aggregations
4. **Subscribe to refresh logs** for realtime updates
5. **Handle idempotency** in offline sync scenarios

### For Admins

1. **Monitor audit tables** regularly for security
2. **Refresh materialized views** if manual refresh needed
3. **Use lock_event() cautiously** - it affects all judges
4. **Check pin_verification_attempts** for suspicious activity

---

## Realtime Subscriptions

### Recommended Subscriptions

**Judges:**
- `rankings_refresh_log` - Know when to refetch rankings
- `autosave_ballots` (own records) - Cross-device sync

**Admins:**
- `progress_refresh_log` - Progress matrix updates
- `rankings_refresh_log` - Rankings updates
- `ballot_unlock_requests` - New unlock requests
- `admin_timer_state` - Timer state changes

---

## Performance Considerations

1. **Materialized view refresh** triggers on every ballot change
   - Uses CONCURRENTLY for non-blocking refresh
   - May add slight latency (acceptable for real-time context)

2. **Autosave frequency** should be throttled client-side
   - Recommended: 1.5s debounce
   - Prevents excessive writes and view refreshes

3. **Realtime scaling** may require connection pooling
   - Monitor concurrent connections
   - Implement reconnection logic with exponential backoff

---

## Backup and Recovery

1. **Supabase automatic backups** are enabled
2. **Point-in-time recovery** available for production
3. **Migration-driven schema** enables easy disaster recovery
4. **Audit trails** provide data provenance

---

**Document End**
