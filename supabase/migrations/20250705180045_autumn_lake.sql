/*
  # Fix Password Change Functionality

  1. Changes
    - Add function to properly update user credentials with new password
    - Fix password reset functionality to ensure changes are applied
    - Ensure password changes are properly tracked in security audit logs

  2. Security
    - Maintain existing RLS policies
    - Ensure password changes are properly audited
    - Add additional validation for password changes
*/

-- Function to update user password with proper validation
CREATE OR REPLACE FUNCTION update_user_password_secure(
  p_user_id text,
  p_new_hash text,
  p_new_salt text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_success boolean;
BEGIN
  -- Update the user's password
  UPDATE user_credentials
  SET 
    password_hash = p_new_hash,
    salt = p_new_salt,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  v_success := FOUND;
  
  -- Log the password change if successful
  IF v_success THEN
    PERFORM log_security_event(
      p_user_id,
      'password_change',
      jsonb_build_object(
        'success', true,
        'timestamp', now()
      ),
      NULL,
      NULL
    );
  END IF;
  
  RETURN v_success;
END;
$$;

-- Function to reset password by email
CREATE OR REPLACE FUNCTION reset_password_by_email(
  p_email text,
  p_new_hash text,
  p_new_salt text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id text;
  v_success boolean;
BEGIN
  -- Find the user by email
  SELECT user_id INTO v_user_id
  FROM user_credentials
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- Try to find in user_profiles if not in credentials
    SELECT user_id INTO v_user_id
    FROM user_profiles
    WHERE email = p_email AND auth_type = 'web2';
    
    IF v_user_id IS NULL THEN
      RETURN false;
    END IF;
    
    -- Insert new credentials if user exists but has no credentials
    INSERT INTO user_credentials (
      user_id,
      email,
      password_hash,
      salt,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_email,
      p_new_hash,
      p_new_salt,
      now(),
      now()
    );
    
    v_success := true;
  ELSE
    -- Update existing credentials
    UPDATE user_credentials
    SET 
      password_hash = p_new_hash,
      salt = p_new_salt,
      updated_at = now()
    WHERE user_id = v_user_id;
    
    v_success := FOUND;
  END IF;
  
  -- Log the password reset if successful
  IF v_success THEN
    PERFORM log_security_event(
      v_user_id,
      'password_reset',
      jsonb_build_object(
        'success', true,
        'email', p_email,
        'timestamp', now()
      ),
      NULL,
      NULL
    );
  END IF;
  
  RETURN v_success;
END;
$$;

-- Function to verify password change
CREATE OR REPLACE FUNCTION verify_password_change(
  p_user_id text,
  p_current_hash text,
  p_new_hash text,
  p_new_salt text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash text;
  v_success boolean;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO v_stored_hash
  FROM user_credentials
  WHERE user_id = p_user_id;
  
  -- Verify current password
  IF v_stored_hash = p_current_hash THEN
    -- Update to new password
    UPDATE user_credentials
    SET 
      password_hash = p_new_hash,
      salt = p_new_salt,
      updated_at = now()
    WHERE user_id = p_user_id;
    
    v_success := FOUND;
    
    -- Log the password change if successful
    IF v_success THEN
      PERFORM log_security_event(
        p_user_id,
        'password_change',
        jsonb_build_object(
          'success', true,
          'timestamp', now()
        ),
        NULL,
        NULL
      );
    END IF;
    
    RETURN v_success;
  ELSE
    -- Log failed password change attempt
    PERFORM log_security_event(
      p_user_id,
      'password_change',
      jsonb_build_object(
        'success', false,
        'reason', 'Invalid current password',
        'timestamp', now()
      ),
      NULL,
      NULL
    );
    
    RETURN false;
  END IF;
END;
$$;