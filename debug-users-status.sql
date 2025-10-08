-- Check users status and role issues
-- Run this in Supabase SQL Editor

-- Check all users in public.users table
SELECT 
  id, 
  email, 
  role, 
  name, 
  phone, 
  department, 
  created_at, 
  updated_at
FROM public.users 
ORDER BY created_at DESC;

-- Check if there are any users in auth.users that don't exist in public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Check for role constraint violations
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role NOT IN ('admin', 'user', 'Administrator', 'Manager', 'Technician', 'Support Agent', 'Design', 'Marketing', 'E-commerce') 
    THEN 'INVALID_ROLE'
    ELSE 'VALID_ROLE'
  END as role_status
FROM public.users;

-- Check for duplicate emails
SELECT 
  email,
  COUNT(*) as count
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for users with NULL roles
SELECT 
  id,
  email,
  role,
  name
FROM public.users
WHERE role IS NULL;
