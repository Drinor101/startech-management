-- Add password field to users table
-- Run this in Supabase SQL Editor

-- Add password column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Update the existing user with a password
-- For now, we'll use a simple password (in production, you should hash passwords)
UPDATE public.users 
SET password = 'drini123' 
WHERE name = 'drini';

-- Create a simple password verification function
CREATE OR REPLACE FUNCTION verify_user_password(username TEXT, user_password TEXT)
RETURNS TABLE(id UUID, email TEXT, role TEXT, name TEXT, phone TEXT, department TEXT, created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role, u.name, u.phone, u.department, u.created_at, u.updated_at
  FROM public.users u
  WHERE u.name = username AND u.password = user_password;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO anon, authenticated;
