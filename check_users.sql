-- Check existing users and their types
SELECT email, user_type, created_at FROM profiles ORDER BY created_at DESC LIMIT 10;

-- To make a user admin, uncomment and modify the following line:
-- UPDATE profiles SET user_type = 'admin' WHERE email = 'your-admin-email@example.com';
