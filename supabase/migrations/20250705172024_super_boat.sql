/*
  # Fix AXI Number Sync with User Credentials

  1. Changes
    - Add function to sync AXI numbers from user_profiles to user_credentials
    - Add trigger to automatically update AXI number in credentials when a user profile is updated
    - Run a one-time sync to update existing records

  2. Security
    - Maintain existing RLS policies
    - No changes to access control

  3. Benefits
    - Ensures AXI numbers are consistent between profiles and credentials
    - Simplifies user identification across tables
    - Improves data integrity
*/

-- Function to sync AXI number from profile to credentials
CREATE OR REPLACE FUNCTION sync_axi_number_to_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the AXI number in user_credentials when it changes in user_profiles
  UPDATE user_credentials
  SET axi_number = NEW.axi_number,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync AXI number when profile is updated
DROP TRIGGER IF EXISTS sync_axi_number_trigger ON user_profiles;

CREATE TRIGGER sync_axi_number_trigger
  AFTER INSERT OR UPDATE OF axi_number ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_axi_number_to_credentials();

-- Run a one-time sync to update all existing records
DO $$
BEGIN
  UPDATE user_credentials uc
  SET axi_number = up.axi_number
  FROM user_profiles up
  WHERE uc.user_id = up.user_id
  AND (uc.axi_number IS NULL OR uc.axi_number != up.axi_number);
  
  RAISE NOTICE 'Synced AXI numbers from user_profiles to user_credentials';
END $$;