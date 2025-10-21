-- Shtoj kolonën comments në tabelat tasks, services, dhe tickets
-- Ekzekutoni këtë skript në Supabase SQL Editor

-- Shtoj kolonën comments në tabelën tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';

-- Shtoj kolonën comments në tabelën services  
ALTER TABLE services ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';

-- Shtoj kolonën comments në tabelën tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS comments TEXT DEFAULT '';

-- Përditësoj komentet ekzistuese nëse ka
UPDATE tasks SET comments = '[]' WHERE comments IS NULL OR comments = '';
UPDATE services SET comments = '[]' WHERE comments IS NULL OR comments = '';
UPDATE tickets SET comments = '[]' WHERE comments IS NULL OR comments = '';

-- Shtoj koment për të dokumentuar ndryshimin
COMMENT ON COLUMN tasks.comments IS 'Komentet për task-un në format JSON ose tekst';
COMMENT ON COLUMN services.comments IS 'Komentet për shërbimin në format JSON ose tekst';
COMMENT ON COLUMN tickets.comments IS 'Komentet për ticket-in në format JSON ose tekst';
