-- Kontrolloj tabelën users në Supabase
-- Ekzekutoni këtë në Supabase SQL Editor

-- Shfaq të gjithë përdoruesit
SELECT 
    id,
    email,
    name,
    role,
    department,
    phone,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC;

-- Numri i përdoruesve
SELECT COUNT(*) as total_users FROM users;

-- Përdoruesit me role të ndryshme
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;
