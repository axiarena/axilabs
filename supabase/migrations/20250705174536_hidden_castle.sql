/*
  # Security Enhancements for AXI ASI LAB

  1. New Tables
    - `user_sessions` - Tracks active user sessions with expiration
    - `login_attempts` - Tracks failed login attempts for rate limiting
    - `security_audit_logs` - Logs security-related events for auditing

  2. New Functions
    - `create_user_session` - Creates a new session with expiration
    - `validate_user_session` - Validates if a session is active and not expired
    - `invalidate_user_session` - Invalidates a session (logout)
    - `check_rate_limit` - Checks if a user/IP has exceeded login attempt limits
    - `log_security_event` - Logs security events for audit purposes

  3. Security Enhancements
    - Session management with proper expiration
    - Rate limiting for login attempts
    - Comprehensive security audit logging
    - Email verification tracking
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_active_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  is_valid boolean DEFAULT true
);

-- Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username_or_email text NOT NULL,
  ip_address text,
  attempt_time timestamptz DEFAULT now(),
  success boolean DEFAULT false,
  user_agent text
);

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  event_type text NOT NULL,
  event_details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add email_verified column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policies for security_audit_logs
CREATE POLICY "Users can view their own audit logs"
  ON security_audit_logs
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username_or_email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempt_time);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_time ON security_audit_logs(created_at);

-- Function to create a new user session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_duration interval DEFAULT interval '7 days'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_token text;
  v_expires_at timestamptz;
BEGIN
  -- Generate a secure random token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + p_session_duration;
  
  -- Insert the new session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    v_session_token,
    v_expires_at,
    p_ip_address,
    p_user_agent
  );
  
  -- Log the session creation
  PERFORM log_security_event(
    p_user_id,
    'session_created',
    jsonb_build_object(
      'expires_at', v_expires_at,
      'ip_address', p_ip_address
    ),
    p_ip_address,
    p_user_agent
  );
  
  RETURN v_session_token;
END;
$$;

-- Function to validate a user session
CREATE OR REPLACE FUNCTION validate_user_session(
  p_session_token text
)
RETURNS TABLE(
  is_valid boolean,
  user_id text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_active_at and return session info
  RETURN QUERY
  UPDATE user_sessions
  SET last_active_at = now()
  WHERE session_token = p_session_token
    AND expires_at > now()
    AND is_valid = true
  RETURNING 
    true,
    user_sessions.user_id,
    user_sessions.expires_at;
    
  -- If no rows returned, session is invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamptz;
  END IF;
END;
$$;

-- Function to invalidate a user session (logout)
CREATE OR REPLACE FUNCTION invalidate_user_session(
  p_session_token text,
  p_user_id text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_success boolean;
BEGIN
  -- Invalidate the session
  UPDATE user_sessions
  SET is_valid = false
  WHERE session_token = p_session_token
    AND user_id = p_user_id
    AND is_valid = true;
    
  v_success := FOUND;
  
  -- Log the session invalidation
  IF v_success THEN
    PERFORM log_security_event(
      p_user_id,
      'session_invalidated',
      jsonb_build_object(
        'session_token', p_session_token,
        'ip_address', p_ip_address
      ),
      p_ip_address,
      p_user_agent
    );
  END IF;
  
  RETURN v_success;
END;
$$;

-- Function to check rate limits for login attempts
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_username_or_email text,
  p_ip_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_attempts integer;
  v_max_attempts integer := 5; -- Maximum 5 failed attempts
  v_timeframe interval := interval '15 minutes'; -- Within 15 minutes
BEGIN
  -- Count recent failed attempts
  SELECT COUNT(*) INTO v_recent_attempts
  FROM login_attempts
  WHERE (username_or_email = p_username_or_email OR ip_address = p_ip_address)
    AND success = false
    AND attempt_time > now() - v_timeframe;
    
  -- Return true if rate limit exceeded
  RETURN v_recent_attempts >= v_max_attempts;
END;
$$;

-- Function to record login attempts
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_username_or_email text,
  p_success boolean,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the login attempt
  INSERT INTO login_attempts (
    username_or_email,
    ip_address,
    success,
    user_agent
  ) VALUES (
    p_username_or_email,
    p_ip_address,
    p_success,
    p_user_agent
  );
  
  -- Log the security event
  PERFORM log_security_event(
    NULL, -- user_id unknown at this point
    CASE WHEN p_success THEN 'login_success' ELSE 'login_failure' END,
    jsonb_build_object(
      'username_or_email', p_username_or_email,
      'ip_address', p_ip_address
    ),
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id text,
  p_event_type text,
  p_event_details jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert the security event
  INSERT INTO security_audit_logs (
    user_id,
    event_type,
    event_details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to verify email
CREATE OR REPLACE FUNCTION verify_user_email(
  p_user_id text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_success boolean;
BEGIN
  -- Update the user profile
  UPDATE user_profiles
  SET email_verified = true,
      updated_at = now()
  WHERE user_id = p_user_id
    AND email = p_email;
    
  v_success := FOUND;
  
  -- Log the email verification
  IF v_success THEN
    PERFORM log_security_event(
      p_user_id,
      'email_verified',
      jsonb_build_object('email', p_email),
      NULL,
      NULL
    );
  END IF;
  
  RETURN v_success;
END;
$$;

-- Function to clean up expired sessions (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Delete expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < now()
  RETURNING COUNT(*) INTO v_count;
  
  RETURN v_count;
END;
$$;

-- Function to get user's active sessions
CREATE OR REPLACE FUNCTION get_user_active_sessions(
  p_user_id text
)
RETURNS TABLE(
  session_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  last_active_at timestamptz,
  ip_address text,
  user_agent text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    created_at,
    expires_at,
    last_active_at,
    ip_address,
    user_agent
  FROM user_sessions
  WHERE user_id = p_user_id
    AND expires_at > now()
    AND is_valid = true
  ORDER BY last_active_at DESC;
END;
$$;