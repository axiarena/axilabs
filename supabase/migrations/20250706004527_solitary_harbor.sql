/*
  # DO NOT MODIFY - Authentication System
  
  This migration adds comments to critical authentication tables and functions
  to indicate they should not be modified without careful consideration.
  
  These components handle:
  - User authentication
  - Email verification
  - Password management
  - Session handling
  - Security auditing
  
  Any changes to these components could break the authentication system
  and should be thoroughly tested before deployment.
*/

-- Add comments to tables
COMMENT ON TABLE user_profiles IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON TABLE user_credentials IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON TABLE user_sessions IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON TABLE login_attempts IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON TABLE security_audit_logs IS 'DO NOT MODIFY - Critical authentication component';

-- Add comments to functions
COMMENT ON FUNCTION verify_user_credentials IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION update_user_password IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION update_user_password_secure IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION reset_password_by_email IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION verify_password_change IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION verify_user_email IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION create_user_session IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION validate_user_session IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION invalidate_user_session IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION check_rate_limit IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION record_login_attempt IS 'DO NOT MODIFY - Critical authentication component';
COMMENT ON FUNCTION log_security_event IS 'DO NOT MODIFY - Critical authentication component';

-- Create a view to list all protected components
CREATE OR REPLACE VIEW protected_auth_components AS
SELECT 
  table_name AS component_name,
  'table' AS component_type,
  obj_description(pgclass.oid) AS protection_comment
FROM pg_class pgclass
JOIN pg_namespace pgnamespace ON pgclass.relnamespace = pgnamespace.oid
JOIN information_schema.tables t ON pgclass.relname = t.table_name
WHERE t.table_schema = 'public'
AND obj_description(pgclass.oid) LIKE 'DO NOT MODIFY%'

UNION ALL

SELECT 
  routine_name AS component_name,
  'function' AS component_type,
  obj_description(pg_proc.oid) AS protection_comment
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
JOIN information_schema.routines r ON pg_proc.proname = r.routine_name
WHERE r.routine_schema = 'public'
AND obj_description(pg_proc.oid) LIKE 'DO NOT MODIFY%';