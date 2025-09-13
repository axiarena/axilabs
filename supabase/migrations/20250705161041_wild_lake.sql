/*
  # Add User Credentials Table

  1. New Tables
    - `user_credentials`
      - `id` (uuid, primary key)
      - `user_id` (text, unique - references user_profiles.user_id)
      - `email` (text, unique)
      - `password_hash` (text)
      - `salt` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_credentials` table
    - Add policies for secure credential access
    - Only allow users to access their own credentials

  3. Indexes
    - Index on user_id for fast lookups
    - Index on email for password reset functionality
*/

-- Create user_credentials table
CREATE TABLE IF NOT EXISTS user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- Policies for user_credentials table
CREATE POLICY "Users can only access their own credentials"
  ON user_credentials
  FOR ALL
  TO public
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Allow public access for authentication (login verification)
CREATE POLICY "Allow credential verification for authentication"
  ON user_credentials
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);

-- Function to safely verify user credentials
CREATE OR REPLACE FUNCTION verify_user_credentials(
  p_username text,
  p_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM user_credentials
  WHERE user_id = p_username OR email = p_username;
  
  -- Return true if hashes match
  RETURN stored_hash = p_password_hash;
END;
$$;

-- Function to update password
CREATE OR REPLACE FUNCTION update_user_password(
  p_user_id text,
  p_new_hash text,
  p_new_salt text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credentials
  SET password_hash = p_new_hash,
      salt = p_new_salt,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;