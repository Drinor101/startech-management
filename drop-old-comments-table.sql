-- Fshij tabelën e vjetër comments dhe të gjitha indekset/trigger-at e saj
-- Ekzekutoni këtë skript në Supabase SQL Editor PASI të keni ekzekutuar add-comments-column.sql

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
