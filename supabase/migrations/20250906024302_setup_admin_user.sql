-- Setup admin user - Run this after creating your first user account
-- This migration will set the most recently created user as admin
-- You can also manually update specific users by email

-- Option 1: Set the most recent user as admin (recommended for initial setup)
UPDATE profiles 
SET user_type = 'admin' 
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Option 2: Set a specific user as admin by email (uncomment and modify)
-- UPDATE profiles SET user_type = 'admin' WHERE email = 'your-admin-email@example.com';

-- Show current admin users for verification
-- SELECT email, user_type, created_at FROM profiles WHERE user_type = 'admin';
