-- Fix për users table - ekzekuto këtë në Supabase SQL Editor

-- Shto kolonat që mungojnë në users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Aktivizimi i Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Fshi policies ekzistuese nëse ekzistojnë
DROP POLICY IF EXISTS "Authenticated users can read all data" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert data" ON users;

-- Krijo policies të reja
CREATE POLICY "Authenticated users can read all data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert data" ON users FOR INSERT TO authenticated WITH CHECK (true);

-- Shto admin user nëse nuk ekziston
-- Zëvendëso 'admin@startech.com' me email-in e vërtetë të admin user
INSERT INTO users (id, email, role, name) 
SELECT 
  au.id,
  au.email,
  'admin',
  'Admin User'
FROM auth.users au
WHERE au.email = 'admin@startech.com'  -- Zëvendëso me email-in e admin user
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
  );
