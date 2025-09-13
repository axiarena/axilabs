/*
  # Add Two-Factor Authentication columns to user_credentials table

  1. New Columns
    - `two_factor_secret` (text, nullable) - TOTP secret for 2FA
    - `two_factor_enabled` (boolean, default false) - Whether 2FA is enabled
    - `backup_codes` (text array, nullable) - Backup codes for account recovery

  2. Security
    - These columns store encrypted 2FA data
    - Backup codes are one-time use for account recovery
    - TOTP secrets are used for authenticator app verification

  3. Indexes
    - Index on two_factor_enabled for quick lookups
*/

-- Add 2FA columns to user_credentials table
DO $$
BEGIN
  -- Add two_factor_secret column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credentials' AND column_name = 'two_factor_secret'
  ) THEN
    ALTER TABLE user_credentials ADD COLUMN two_factor_secret text;
  END IF;

  -- Add two_factor_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credentials' AND column_name = 'two_factor_enabled'
  ) THEN
    ALTER TABLE user_credentials ADD COLUMN two_factor_enabled boolean DEFAULT false;
  END IF;

  -- Add backup_codes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credentials' AND column_name = 'backup_codes'
  ) THEN
    ALTER TABLE user_credentials ADD COLUMN backup_codes text[];
  END IF;
END $$;

-- Create index for 2FA enabled lookups
CREATE INDEX IF NOT EXISTS idx_user_credentials_2fa_enabled ON user_credentials(two_factor_enabled);

-- Function to check if user has 2FA enabled
CREATE OR REPLACE FUNCTION is_2fa_enabled(p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_enabled boolean;
BEGIN
  SELECT two_factor_enabled INTO is_enabled
  FROM user_credentials
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(is_enabled, false);
END;
$$;

-- Function to get 2FA data for verification
CREATE OR REPLACE FUNCTION get_2fa_data(p_user_id text)
RETURNS TABLE(secret text, backup_codes text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT two_factor_secret, user_credentials.backup_codes
  FROM user_credentials
  WHERE user_id = p_user_id AND two_factor_enabled = true;
END;
$$;