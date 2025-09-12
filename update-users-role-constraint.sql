-- Update users table role constraint to include new Albanian roles
-- Run this in Supabase SQL Editor

-- First, drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new check constraint with all 7 Albanian roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
  'admin', 
  'user', 
  'Administrator', 
  'Menaxher', 
  'Marketer', 
  'Dizajner', 
  'Agjent shitjeje', 
  'Agjent mbështetje', 
  'Serviser'
));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'users_role_check';
