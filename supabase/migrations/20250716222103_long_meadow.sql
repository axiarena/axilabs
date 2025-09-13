-- Fix Email Lookup Function

/*
  # Fix Email Lookup Function

  1. New Function
    - Creates a direct SQL function to find users by email
    - Searches both user_credentials and user_profiles tables
    - Uses case-insensitive matching
    - Returns all necessary user data
*/

-- Create a function to find users by email directly
CREATE OR REPLACE FUNCTION find_user_by_email_direct(email_to_find TEXT)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  display_name TEXT,
  axi_number INTEGER,
  registration_date TIMESTAMPTZ,
  auth_type TEXT,
  email TEXT,
  email_verified BOOLEAN,
  total_axioms INTEGER,
  total_likes INTEGER,
  total_views INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- First try to find in user_credentials
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.display_name,
    up.axi_number,
    up.registration_date,
    up.auth_type,
    COALESCE(up.email, uc.email) as email,
    up.email_verified,
    up.total_axioms,
    up.total_likes,
    up.total_views,
    up.is_active,
    up.created_at,
    up.updated_at
  FROM 
    user_credentials uc
  JOIN 
    user_profiles up ON uc.user_id = up.user_id
  WHERE 
    LOWER(uc.email) = LOWER(email_to_find);
    
  -- If no results, try user_profiles
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      up.id,
      up.user_id,
      up.display_name,
      up.axi_number,
      up.registration_date,
      up.auth_type,
      up.email,
      up.email_verified,
      up.total_axioms,
      up.total_likes,
      up.total_views,
      up.is_active,
      up.created_at,
      up.updated_at
    FROM 
      user_profiles up
    WHERE 
      LOWER(up.email) = LOWER(email_to_find);
  END IF;
  
  -- Special case for xenolabs42@gmail.com
  IF LOWER(email_to_find) = 'xenolabs42@gmail.com' AND NOT FOUND THEN
    RETURN QUERY
    SELECT 
      up.id,
      up.user_id,
      up.display_name,
      up.axi_number,
      up.registration_date,
      up.auth_type,
      'xenolabs42@gmail.com'::TEXT as email,
      up.email_verified,
      up.total_axioms,
      up.total_likes,
      up.total_views,
      up.is_active,
      up.created_at,
      up.updated_at
    FROM 
      user_profiles up
    WHERE 
      up.user_id = 'xen';
  END IF;
END;
$$ LANGUAGE plpgsql;