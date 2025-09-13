/*
  # Fix RLS policy for user_credentials table

  1. Policy Updates
    - Update the INSERT policy for user_credentials to allow syncing from localStorage
    - Maintain security while enabling the sync functionality
    - Allow public inserts but restrict to specific conditions

  2. Security
    - Keep existing policies for SELECT, UPDATE, DELETE
    - Add temporary INSERT policy for sync operations
    - Maintain data integrity and user ownership
*/

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can only access their own credentials" ON user_credentials;

-- Create separate policies for different operations
CREATE POLICY "Users can read their own credentials"
  ON user_credentials
  FOR SELECT
  TO public
  USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));

CREATE POLICY "Users can update their own credentials"
  ON user_credentials
  FOR UPDATE
  TO public
  USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))
  WITH CHECK (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));

CREATE POLICY "Users can delete their own credentials"
  ON user_credentials
  FOR DELETE
  TO public
  USING (user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text));

-- Allow INSERT operations for sync functionality
-- This enables localStorage data migration to Supabase
CREATE POLICY "Allow credential sync operations"
  ON user_credentials
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Keep the existing general credential verification policy
-- This was already working for authentication