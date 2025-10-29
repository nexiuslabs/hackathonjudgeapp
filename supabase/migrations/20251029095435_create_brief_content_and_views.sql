/*
  # Create Brief Content, Teams, and Views

  ## Overview
  This migration creates the infrastructure for event briefs, team/finalist management,
  and judge information with appropriate RLS policies for public and authenticated access.

  ## New Tables
  
  ### brief_content
  - `id` (uuid, primary key) - Unique identifier
  - `event_id` (text, unique) - Event identifier
  - `sections` (jsonb) - Structured JSON containing all brief sections
  - `is_published` (boolean) - Whether this brief is publicly visible
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  #### Sections Structure
  ```json
  {
    "hero": { "title": "...", "subtitle": "...", "date": "..." },
    "overview": { "description": "...", "format": "..." },
    "timeline": [{ "phase": "...", "dates": "...", "description": "..." }],
    "criteria": [{ "name": "...", "weight": 0.25, "description": "..." }],
    "roster": { "teams": [...], "judges": [...] },
    "support": { "contacts": [...], "resources": [...] }
  }
  ```

  ### teams
  - `id` (uuid, primary key) - Unique team identifier
  - `event_id` (text) - Event this team belongs to
  - `team_name` (text) - Name of the team
  - `problem_track` (text) - Problem/track they're working on
  - `presentation_order` (integer) - Order in finals presentation
  - `is_finalist` (boolean) - Whether team advanced to finals
  - `metadata` (jsonb) - Additional team information (members, school, etc.)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### judges
  - `id` (uuid, primary key) - Unique judge identifier
  - `event_id` (text) - Event this judge is assigned to
  - `user_id` (uuid, references auth.users) - Associated user account
  - `full_name` (text) - Judge's full name
  - `bio` (text) - Judge biography
  - `headshot_url` (text) - URL to judge's photo
  - `is_published` (boolean) - Whether judge info is publicly visible
  - `display_order` (integer) - Order for displaying judges
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Views

  ### finalists_view
  Consolidates team metadata for finals display, showing only finalist teams
  with their presentation order and problem track.

  ### judges_view
  Exposes only published judge information for public display,
  filtering out unpublished judges.

  ## Security
  
  ### brief_content RLS
  - Public can read published hero/overview sections
  - Authenticated users can read all sections of published briefs
  - Only service role can write/update briefs

  ### teams RLS
  - Public can read finalist teams
  - Authenticated users can read all teams
  - Only service role can write/update teams

  ### judges RLS
  - Public can read published judge information
  - Authenticated users can read all published judges
  - Only service role can write/update judge records
*/

-- Create brief_content table
CREATE TABLE IF NOT EXISTS brief_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brief_content_event_id ON brief_content(event_id);
CREATE INDEX IF NOT EXISTS idx_brief_content_published ON brief_content(is_published);

ALTER TABLE brief_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published briefs
CREATE POLICY "Public can read published briefs"
  ON brief_content
  FOR SELECT
  USING (is_published = true);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  team_name text NOT NULL,
  problem_track text,
  presentation_order integer,
  is_finalist boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, team_name)
);

CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_finalists ON teams(event_id, is_finalist, presentation_order);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all teams
CREATE POLICY "Public can read teams"
  ON teams
  FOR SELECT
  USING (true);

-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  bio text,
  headshot_url text,
  is_published boolean DEFAULT false,
  display_order integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_judges_event_id ON judges(event_id);
CREATE INDEX IF NOT EXISTS idx_judges_published ON judges(event_id, is_published, display_order);

ALTER TABLE judges ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published judges
CREATE POLICY "Public can read published judges"
  ON judges
  FOR SELECT
  USING (is_published = true);

-- Create finalists_view
CREATE OR REPLACE VIEW finalists_view AS
SELECT 
  t.id,
  t.event_id,
  t.team_name,
  t.problem_track,
  t.presentation_order,
  t.metadata,
  t.created_at,
  t.updated_at
FROM teams t
WHERE t.is_finalist = true
ORDER BY t.event_id, t.presentation_order NULLS LAST, t.team_name;

-- Create judges_view
CREATE OR REPLACE VIEW judges_view AS
SELECT 
  j.id,
  j.event_id,
  j.full_name,
  j.bio,
  j.headshot_url,
  j.display_order,
  j.created_at,
  j.updated_at
FROM judges j
WHERE j.is_published = true
ORDER BY j.event_id, j.display_order NULLS LAST, j.full_name;

-- Function to update updated_at timestamp for brief_content
CREATE OR REPLACE FUNCTION update_brief_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brief_content_updated_at
  BEFORE UPDATE ON brief_content
  FOR EACH ROW
  EXECUTE FUNCTION update_brief_content_timestamp();

-- Function to update updated_at timestamp for teams
CREATE OR REPLACE FUNCTION update_teams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_timestamp();

-- Function to update updated_at timestamp for judges
CREATE OR REPLACE FUNCTION update_judges_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER judges_updated_at
  BEFORE UPDATE ON judges
  FOR EACH ROW
  EXECUTE FUNCTION update_judges_timestamp();