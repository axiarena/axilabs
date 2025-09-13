/*
  # Add AXI Number to User Credentials Table

  1. New Columns
    - `axi_number` (integer) - AXI number for easy reference in credentials table

  2. Changes
    - Add axi_number column to user_credentials table
    - Create index for axi_number lookups
    - Update sync functions to include AXI numbers

  3. Data Integrity
    - Keep AXI number in both user_profiles and user_credentials for consistency
    - Enable easier credential-based lookups with AXI numbers
*/

-- Add axi_number column to user_credentials table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_credentials' AND column_name = 'axi_number'
  ) THEN
    ALTER TABLE user_credentials ADD COLUMN axi_number integer;
  END IF;
END $$;

-- Create index for axi_number lookups in credentials
CREATE INDEX IF NOT EXISTS idx_user_credentials_axi_number ON user_credentials(axi_number);

-- Function to sync AXI numbers from user_profiles to user_credentials
CREATE OR REPLACE FUNCTION sync_axi_numbers_to_credentials()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update existing credentials with AXI numbers from profiles
  UPDATE user_credentials 
  SET axi_number = up.axi_number
  FROM user_profiles up
  WHERE user_credentials.user_id = up.user_id 
  AND user_credentials.axi_number IS NULL;
  
  -- Log the update
  RAISE NOTICE 'Synced AXI numbers to user_credentials table';
END;
$$;

-- Run the sync function to update existing records
SELECT sync_axi_numbers_to_credentials();