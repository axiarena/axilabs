/*
  # Add email column to user_profiles table

  1. New Columns
    - `email` (text, unique) - Email address for web2 users

  2. New Functions
    - `find_user_by_email` - Function to find users by email for password reset

  3. Security
    - Add policy for email-based lookups for password reset
    - Create index for email performance

  4. Changes
    - Add email column to user_profiles table
    - Enable email-based user lookup for forgot password functionality
*/

-- Add email column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text UNIQUE;
  END IF;
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Function to find user by email (for password reset)
CREATE OR REPLACE FUNCTION find_user_by_email(p_email text)
RETURNS TABLE(user_id text, display_name text, auth_type text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT up.user_id, up.display_name, up.auth_type
  FROM user_profiles up
  WHERE up.email = p_email AND up.auth_type = 'web2' AND up.is_active = true;
END;
$$;

-- Drop existing policy if it exists and create new one
DO $$
BEGIN
  -- Drop the policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Allow email lookup for password reset'
  ) THEN
    DROP POLICY "Allow email lookup for password reset" ON user_profiles;
  END IF;
  
  -- Create the new policy
  EXECUTE 'CREATE POLICY "Allow email lookup for password reset"
    ON user_profiles
    FOR SELECT
    TO public
    USING (email IS NOT NULL AND auth_type = ''web2'')';
END $$;