-- Create is_admin RPC function to check if a user is an admin
-- Drop function first if it exists
DROP FUNCTION IF EXISTS is_admin(text);

-- Create the function
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = user_email
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(text) TO authenticated;
