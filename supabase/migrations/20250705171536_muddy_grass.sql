/*
  # Add User Clones Schema

  1. New Tables
    - `user_clones`
      - `id` (uuid, primary key)
      - `user_id` (text, references user_profiles.user_id)
      - `name` (text, clone name)
      - `handle` (text, social media handle)
      - `url` (text, social media profile URL)
      - `status` (text, active/inactive/pending)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_active` (timestamp)
      - `capabilities` (text[], what the clone can do)
      - `personality` (text, clone personality traits)
      - `avatar_url` (text, clone avatar image URL)
      - `is_public` (boolean, whether clone is publicly visible)
      - `daily_tasks` (jsonb, tasks the clone performs daily)
      - `performance_metrics` (jsonb, metrics on clone performance)

  2. Security
    - Enable RLS on `user_clones` table
    - Add policies for users to manage their own clones
    - Add policies for public viewing of public clones

  3. Functions
    - `assign_clone_tasks` function to schedule daily tasks
    - `update_clone_metrics` function to track performance
*/

-- Create user_clones table
CREATE TABLE IF NOT EXISTS user_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  handle text,
  url text,
  status text DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active timestamptz,
  capabilities text[],
  personality text,
  avatar_url text,
  is_public boolean DEFAULT false,
  daily_tasks jsonb DEFAULT '[]'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE user_clones ENABLE ROW LEVEL SECURITY;

-- Policies for user_clones table
CREATE POLICY "Public clones are viewable by everyone"
  ON user_clones
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own clones"
  ON user_clones
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own clones"
  ON user_clones
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own clones"
  ON user_clones
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own clones"
  ON user_clones
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_clones_user_id ON user_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clones_status ON user_clones(status);
CREATE INDEX IF NOT EXISTS idx_user_clones_is_public ON user_clones(is_public);

-- Function to assign daily tasks to clones
CREATE OR REPLACE FUNCTION assign_clone_tasks(p_clone_id uuid, p_tasks jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_clones
  SET daily_tasks = p_tasks,
      updated_at = now()
  WHERE id = p_clone_id;
END;
$$;

-- Function to update clone performance metrics
CREATE OR REPLACE FUNCTION update_clone_metrics(p_clone_id uuid, p_metrics jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_metrics jsonb;
BEGIN
  -- Get current metrics
  SELECT performance_metrics INTO current_metrics
  FROM user_clones
  WHERE id = p_clone_id;
  
  -- Update with new metrics (merge)
  UPDATE user_clones
  SET performance_metrics = current_metrics || p_metrics,
      updated_at = now(),
      last_active = now()
  WHERE id = p_clone_id;
END;
$$;

-- Function to get user's active clones
CREATE OR REPLACE FUNCTION get_user_active_clones(p_user_id text)
RETURNS SETOF user_clones
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_clones
  WHERE user_id = p_user_id
  AND status = 'active'
  ORDER BY last_active DESC NULLS LAST;
END;
$$;

-- Create clone_tasks table for more detailed task tracking
CREATE TABLE IF NOT EXISTS clone_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id uuid NOT NULL REFERENCES user_clones(id) ON DELETE CASCADE,
  task_type text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  scheduled_for timestamptz,
  completed_at timestamptz,
  result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clone_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for clone_tasks table
CREATE POLICY "Users can view their clone tasks"
  ON clone_tasks
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_clones
    WHERE user_clones.id = clone_tasks.clone_id
    AND user_clones.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert tasks for their clones"
  ON clone_tasks
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_clones
    WHERE user_clones.id = clone_tasks.clone_id
    AND user_clones.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can update tasks for their clones"
  ON clone_tasks
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_clones
    WHERE user_clones.id = clone_tasks.clone_id
    AND user_clones.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can delete tasks for their clones"
  ON clone_tasks
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_clones
    WHERE user_clones.id = clone_tasks.clone_id
    AND user_clones.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clone_tasks_clone_id ON clone_tasks(clone_id);
CREATE INDEX IF NOT EXISTS idx_clone_tasks_status ON clone_tasks(status);
CREATE INDEX IF NOT EXISTS idx_clone_tasks_scheduled_for ON clone_tasks(scheduled_for);