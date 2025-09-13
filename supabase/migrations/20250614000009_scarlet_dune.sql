/*
  # Add User Profiles Table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (text, unique - wallet address or username)
      - `display_name` (text)
      - `axi_number` (integer, unique - sequential user number)
      - `registration_date` (timestamp)
      - `auth_type` (text - 'wallet' or 'web2')
      - `total_axioms` (integer, default 0)
      - `total_likes` (integer, default 0)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for user profile access
    - Add function to auto-assign AXI numbers

  3. Indexes
    - Index on user_id for fast lookups
    - Index on axi_number for leaderboards
    - Index on registration_date for analytics
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  display_name text NOT NULL,
  axi_number integer UNIQUE NOT NULL,
  registration_date timestamptz DEFAULT now(),
  auth_type text NOT NULL CHECK (auth_type IN ('wallet', 'web2')),
  total_axioms integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_views integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles table
CREATE POLICY "User profiles are viewable by everyone"
  ON user_profiles
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Function to get next AXI number
CREATE OR REPLACE FUNCTION get_next_axi_number()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
BEGIN
  SELECT COALESCE(MAX(axi_number), 0) + 1 
  INTO next_number 
  FROM user_profiles;
  
  RETURN next_number;
END;
$$;

-- Function to auto-assign AXI numbers for new users
CREATE OR REPLACE FUNCTION assign_axi_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.axi_number IS NULL THEN
    NEW.axi_number = get_next_axi_number();
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign AXI numbers
CREATE TRIGGER assign_axi_number_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_axi_number();

-- Function to update user stats when axioms are created/deleted
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment axiom count
    UPDATE user_profiles 
    SET total_axioms = total_axioms + 1,
        updated_at = now()
    WHERE user_id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement axiom count and subtract likes/views
    UPDATE user_profiles 
    SET total_axioms = GREATEST(total_axioms - 1, 0),
        total_likes = GREATEST(total_likes - COALESCE(OLD.likes, 0), 0),
        total_views = GREATEST(total_views - COALESCE(OLD.views, 0), 0),
        updated_at = now()
    WHERE user_id = OLD.author_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update likes/views if they changed
    IF OLD.likes != NEW.likes OR OLD.views != NEW.views THEN
      UPDATE user_profiles 
      SET total_likes = total_likes + (COALESCE(NEW.likes, 0) - COALESCE(OLD.likes, 0)),
          total_views = total_views + (COALESCE(NEW.views, 0) - COALESCE(OLD.views, 0)),
          updated_at = now()
      WHERE user_id = NEW.author_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update user stats when axioms change
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON axioms
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_axi_number ON user_profiles(axi_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_registration_date ON user_profiles(registration_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_likes ON user_profiles(total_likes);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_type ON user_profiles(auth_type);

-- Function to register a new user (upsert)
CREATE OR REPLACE FUNCTION register_user(
  p_user_id text,
  p_display_name text,
  p_auth_type text
)
RETURNS TABLE(axi_number integer, registration_date timestamptz, is_new_user boolean)
LANGUAGE plpgsql
AS $$
DECLARE
  existing_user user_profiles%ROWTYPE;
  result_axi_number integer;
  result_registration_date timestamptz;
  result_is_new_user boolean;
BEGIN
  -- Check if user already exists
  SELECT * INTO existing_user FROM user_profiles WHERE user_id = p_user_id;
  
  IF existing_user.id IS NOT NULL THEN
    -- User exists, return existing data
    result_axi_number := existing_user.axi_number;
    result_registration_date := existing_user.registration_date;
    result_is_new_user := false;
  ELSE
    -- New user, insert and return new data
    INSERT INTO user_profiles (user_id, display_name, auth_type)
    VALUES (p_user_id, p_display_name, p_auth_type)
    RETURNING user_profiles.axi_number, user_profiles.registration_date 
    INTO result_axi_number, result_registration_date;
    
    result_is_new_user := true;
  END IF;
  
  RETURN QUERY SELECT result_axi_number, result_registration_date, result_is_new_user;
END;
$$;