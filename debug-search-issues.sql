-- Check for potential search issues
-- Run this in Supabase SQL Editor

-- Check if tickets table exists and has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if services table exists and has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if customers table exists and has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test search functionality
SELECT * FROM public.tickets 
WHERE title ILIKE '%SRV-2025-009%' 
OR subject ILIKE '%SRV-2025-009%' 
OR description ILIKE '%SRV-2025-009%' 
OR id ILIKE '%SRV-2025-009%'
LIMIT 5;

-- Test services search
SELECT * FROM public.services 
WHERE problem_description ILIKE '%SRV-2025-009%' 
OR solution ILIKE '%SRV-2025-009%' 
OR id ILIKE '%SRV-2025-009%'
LIMIT 5;

-- Test customers search
SELECT * FROM public.customers 
WHERE name ILIKE '%SRV-2025-009%' 
OR email ILIKE '%SRV-2025-009%' 
OR phone ILIKE '%SRV-2025-009%' 
OR address ILIKE '%SRV-2025-009%' 
OR city ILIKE '%SRV-2025-009%' 
OR neighborhood ILIKE '%SRV-2025-009%' 
OR id ILIKE '%SRV-2025-009%'
LIMIT 5;
