-- Add user_type field to profiles table
ALTER TABLE profiles ADD COLUMN user_type text DEFAULT 'customer' CHECK (user_type IN ('customer', 'admin'));

-- Create index for efficient querying by user_type
CREATE INDEX idx_profiles_user_type ON profiles(user_type);

-- Drop the admin_users table since we're moving to user_type field
DROP TABLE IF EXISTS admin_users;

-- Update any existing admin users (you can manually set these in the database)
-- Example: UPDATE profiles SET user_type = 'admin' WHERE email = 'admin@example.com';
