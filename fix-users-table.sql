-- Fix users table to work with current authentication system
-- Run this in Supabase SQL Editor

-- Drop the existing users table and recreate it
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table with auto-generated UUID
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'Administrator', 'Manager', 'Technician', 'Support Agent', 'Design', 'Marketing', 'E-commerce')),
  name TEXT,
  phone TEXT,
  department TEXT,
  password TEXT NOT NULL, -- Add password field for current auth system
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the new users table
CREATE POLICY "Authenticated users can read all data" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert data" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update data" ON public.users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON public.users FOR DELETE TO authenticated USING (true);

-- Insert the existing admin user with a new UUID
INSERT INTO public.users (id, email, role, name, phone, department, password, created_at, updated_at)
VALUES (
  '7651e3fc-2370-4605-a52a-eb5f858344a2'::uuid,
  'admin@startech.com',
  'admin',
  'Admin User',
  '+383 44 123 456',
  'IT',
  'admin123',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
