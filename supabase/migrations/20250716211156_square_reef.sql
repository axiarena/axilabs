/*
  # Fix Email Verification Security Issue

  1. Changes
     - Add email_verified field to user_profiles if it doesn't exist
     - Create function to verify user email securely
     - Add trigger to update email_verified when email changes
     - Add function to check if email is verified

  2. Security
     - Ensures email verification status is properly tracked
     - Prevents security bypass of email verification
*/

-- First check if email_verified column exists, add it if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create or replace function to verify user email
CREATE OR REPLACE FUNCTION verify_user_email(p_user_id TEXT, p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_profiles
  SET email_verified = true,
      updated_at = now()
  WHERE user_id = p_user_id
    AND email = p_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to check if email is verified
CREATE OR REPLACE FUNCTION is_email_verified(p_user_id TEXT, p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_verified BOOLEAN;
BEGIN
  SELECT email_verified INTO v_is_verified
  FROM public.user_profiles
  WHERE user_id = p_user_id
    AND email = p_email;
  
  RETURN COALESCE(v_is_verified, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to reset email_verified when email changes
CREATE OR REPLACE FUNCTION reset_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    NEW.email_verified = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS reset_email_verified_trigger ON public.user_profiles;

-- Create the trigger
CREATE TRIGGER reset_email_verified_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION reset_email_verified();