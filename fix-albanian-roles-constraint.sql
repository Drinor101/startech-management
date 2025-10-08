-- Fix role constraint to allow Albanian roles
-- Run this in Supabase SQL Editor

-- First, let's see what roles are currently in the database
SELECT DISTINCT role FROM public.users ORDER BY role;

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add a new constraint that allows Albanian roles
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  -- English roles
  'admin', 
  'user', 
  'Administrator', 
  'Manager', 
  'Technician', 
  'Support Agent', 
  'Design', 
  'Marketing', 
  'E-commerce',
  -- Albanian roles
  'Menaxher',
  'Serviser',
  'Agjent shitjeje',
  'Marketer',
  'Agjent mbështetje',
  'Dizajn',
  'E-commerce',
  'Teknik',
  'Support',
  'Supervizor',
  'Koordinues',
  'Analist',
  'Zhvillues',
  'Konsulent',
  -- Additional roles
  'administrator',
  'menaxher',
  'teknik',
  'support',
  'dizajn',
  'marketing',
  'e-commerce',
  'supervisor',
  'coordinator',
  'analyst',
  'developer',
  'consultant'
));

-- Verify the constraint was added
SELECT conname, contype, confrelid::regclass as table_name
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';

-- Test the constraint by checking all current roles
SELECT 
  role,
  COUNT(*) as user_count
FROM public.users
GROUP BY role
ORDER BY role;
