-- Test search functionality directly in database
-- Run this in Supabase SQL Editor

-- Test tickets search (tickets are stored in tasks table with type='ticket')
SELECT 
  id, 
  title, 
  description, 
  status, 
  priority,
  type,
  created_at
FROM public.tasks 
WHERE type = 'ticket'
AND (
  title ILIKE '%SRV-2025-009%' 
  OR description ILIKE '%SRV-2025-009%' 
  OR id ILIKE '%SRV-2025-009%'
)
LIMIT 5;

-- Test services search
SELECT 
  id, 
  problem_description, 
  solution, 
  status, 
  category,
  created_at
FROM public.services 
WHERE problem_description ILIKE '%SRV-2025-009%' 
OR solution ILIKE '%SRV-2025-009%' 
OR id ILIKE '%SRV-2025-009%'
LIMIT 5;

-- Test customers search
SELECT 
  id, 
  name, 
  email, 
  phone, 
  address,
  city,
  neighborhood,
  created_at
FROM public.customers 
WHERE name ILIKE '%SRV-2025-009%' 
OR email ILIKE '%SRV-2025-009%' 
OR phone ILIKE '%SRV-2025-009%' 
OR address ILIKE '%SRV-2025-009%' 
OR city ILIKE '%SRV-2025-009%' 
OR neighborhood ILIKE '%SRV-2025-009%' 
OR id ILIKE '%SRV-2025-009%'
LIMIT 5;

-- Check if there are any tickets, services, or customers with SRV-2025-009
SELECT 'tickets' as table_name, COUNT(*) as count FROM public.tasks WHERE type = 'ticket' AND id ILIKE '%SRV-2025-009%'
UNION ALL
SELECT 'services' as table_name, COUNT(*) as count FROM public.services WHERE id ILIKE '%SRV-2025-009%'
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as count FROM public.customers WHERE id ILIKE '%SRV-2025-009%';

-- Check what tickets exist
SELECT 
  id, 
  title, 
  type, 
  status, 
  created_at
FROM public.tasks 
WHERE type = 'ticket'
ORDER BY created_at DESC
LIMIT 10;

-- Check what services exist
SELECT 
  id, 
  problem_description, 
  status, 
  created_at
FROM public.services 
ORDER BY created_at DESC
LIMIT 10;
