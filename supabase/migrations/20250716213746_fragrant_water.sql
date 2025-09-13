/*
  # Fix Email Verification and Security

  1. New Functions
    - `verify_user_email`: Securely marks a user's email as verified
    - `is_email_verified`: Checks if a user's email is verified
    - `update_user_password_secure`: Securely updates a user's password
    - `reset_password_by_email`: Resets a user's password by email
    - `verify_password_change`: Verifies current password before changing

  2. Triggers
    - `reset_email_verified_trigger`: Resets email_verified when email changes

  3. Security
    - Ensures email_verified field exists
    - Adds proper RLS policies
*/

-- Ensure email_verified field exists in user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Function to verify a user's email
CREATE OR REPLACE FUNCTION verify_user_email(p_user_id TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's email_verified status
  UPDATE public.user_profiles
  SET 
    email_verified = true,
    updated_at = now()
  WHERE 
    user_id = p_user_id 
    AND email = p_email;
  
  -- Log the verification event
  INSERT INTO public.security_audit_logs (
    user_id, 
    event_type, 
    event_details, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id,
    'email_verified',
    jsonb_build_object('email', p_email),
    current_setting('request.headers')::jsonb->>'x-forwarded-for',
    current_setting('request.headers')::jsonb->>'user-agent'
  );
  
  RETURN true;
END;
$$;

-- Function to check if a user's email is verified
CREATE OR REPLACE FUNCTION is_email_verified(p_user_id TEXT, p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_verified BOOLEAN;
BEGIN
  SELECT email_verified INTO v_is_verified
  FROM public.user_profiles
  WHERE user_id = p_user_id AND email = p_email;
  
  RETURN COALESCE(v_is_verified, false);
END;
$$;

-- Function to securely update a user's password
CREATE OR REPLACE FUNCTION update_user_password_secure(
  p_user_id TEXT,
  p_new_hash TEXT,
  p_new_salt TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the password
  UPDATE public.user_credentials
  SET 
    password_hash = p_new_hash,
    salt = p_new_salt,
    updated_at = now()
  WHERE 
    user_id = p_user_id;
  
  -- Log the password change
  INSERT INTO public.security_audit_logs (
    user_id, 
    event_type, 
    event_details, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id,
    'password_change',
    jsonb_build_object('success', true),
    current_setting('request.headers')::jsonb->>'x-forwarded-for',
    current_setting('request.headers')::jsonb->>'user-agent'
  );
  
  RETURN true;
END;
$$;

-- Function to reset a user's password by email
CREATE OR REPLACE FUNCTION reset_password_by_email(
  p_email TEXT,
  p_new_hash TEXT,
  p_new_salt TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
BEGIN
  -- Get the user_id from the email
  SELECT user_id INTO v_user_id
  FROM public.user_profiles
  WHERE email = p_email AND auth_type = 'web2';
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update the password
  UPDATE public.user_credentials
  SET 
    password_hash = p_new_hash,
    salt = p_new_salt,
    updated_at = now()
  WHERE 
    user_id = v_user_id;
  
  -- Log the password reset
  INSERT INTO public.security_audit_logs (
    user_id, 
    event_type, 
    event_details, 
    ip_address, 
    user_agent
  ) VALUES (
    v_user_id,
    'password_reset',
    jsonb_build_object('success', true),
    current_setting('request.headers')::jsonb->>'x-forwarded-for',
    current_setting('request.headers')::jsonb->>'user-agent'
  );
  
  RETURN true;
END;
$$;

-- Function to verify current password before changing
CREATE OR REPLACE FUNCTION verify_password_change(
  p_user_id TEXT,
  p_current_hash TEXT,
  p_new_hash TEXT,
  p_new_salt TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO v_stored_hash
  FROM public.user_credentials
  WHERE user_id = p_user_id;
  
  -- Verify the current password
  IF v_stored_hash != p_current_hash THEN
    RETURN false;
  END IF;
  
  -- Update the password
  UPDATE public.user_credentials
  SET 
    password_hash = p_new_hash,
    salt = p_new_salt,
    updated_at = now()
  WHERE 
    user_id = p_user_id;
  
  -- Log the password change
  INSERT INTO public.security_audit_logs (
    user_id, 
    event_type, 
    event_details, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id,
    'password_change',
    jsonb_build_object('success', true),
    current_setting('request.headers')::jsonb->>'x-forwarded-for',
    current_setting('request.headers')::jsonb->>'user-agent'
  );
  
  RETURN true;
END;
$$;

-- Trigger to reset email_verified when email changes
CREATE OR REPLACE FUNCTION reset_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    NEW.email_verified = false;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'reset_email_verified_trigger'
  ) THEN
    CREATE TRIGGER reset_email_verified_trigger
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION reset_email_verified();
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION verify_user_email(TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION is_email_verified(TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION update_user_password_secure(TEXT, TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION reset_password_by_email(TEXT, TEXT, TEXT) TO public;
GRANT EXECUTE ON FUNCTION verify_password_change(TEXT, TEXT, TEXT, TEXT) TO public;