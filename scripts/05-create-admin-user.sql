-- This script should be run after creating an admin user through Supabase Auth
-- Replace 'admin@example.com' with your actual admin email

-- First, you need to sign up an admin user through your app or Supabase dashboard
-- Then run this script to make them an admin

-- Update the user profile to be an admin (replace with actual user ID)
-- You can get the user ID from the auth.users table after signup

INSERT INTO user_profiles (id, email, full_name, role, phone)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    'admin',
    raw_user_meta_data->>'phone'
FROM auth.users 
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin';

-- Note: Replace 'admin@example.com' with your actual admin email
-- You can also manually update this after creating the user:
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
