-- Fix role constraint to allow more roles
-- Run this in Supabase SQL Editor

-- First, let's see what roles are currently in the database
SELECT DISTINCT role FROM public.users;

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add a new constraint that allows more roles
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  'admin', 
  'user', 
  'Administrator', 
  'Manager', 
  'Technician', 
  'Support Agent', 
  'Design', 
  'Marketing', 
  'E-commerce',
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

-- Check if the constraint was added successfully
SELECT conname, contype, confrelid::regclass as table_name
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';

-- Test with a sample role update
-- UPDATE public.users SET role = 'supervisor' WHERE email = 'test@example.com';
