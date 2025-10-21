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

-- Fshij tabelën e vjetër comments dhe të gjitha indekset/trigger-at e saj
-- Fshij tabelën comment_votes së pari (ka foreign key constraint)
DROP TABLE IF EXISTS public.comment_votes CASCADE;

-- Fshij trigger-in
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;

-- Fshij indekset
DROP INDEX IF EXISTS idx_comments_entity;
DROP INDEX IF EXISTS idx_comments_user;
DROP INDEX IF EXISTS idx_comments_parent;
DROP INDEX IF EXISTS idx_comments_created_at;

-- Fshij tabelën comments
DROP TABLE IF EXISTS public.comments CASCADE;

-- Verifikoj që tabela është fshirë
SELECT 'Tabela comments u fshi me sukses!' as status;
