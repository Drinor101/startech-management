-- Check for potential user deletion issues
-- Run this in Supabase SQL Editor

-- Check if there are any foreign key constraints that might cause cascading deletes
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (ccu.table_name = 'users' OR tc.table_name = 'users')
ORDER BY tc.table_name, kcu.column_name;

-- Check for any recent user deletions or updates
SELECT 
  id,
  email,
  role,
  name,
  updated_at,
  CASE 
    WHEN updated_at > NOW() - INTERVAL '1 day' THEN 'RECENT_UPDATE'
    ELSE 'OLD_UPDATE'
  END as update_status
FROM public.users
WHERE updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- Check for any users that might have been deleted from auth.users but still exist in public.users
SELECT 
  pu.id,
  pu.email,
  pu.role,
  pu.name,
  au.id as auth_id
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;
