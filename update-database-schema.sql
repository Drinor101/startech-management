-- Përditësimi i skemës së bazës së të dhënave për specifikimet e reja
-- Ekzekutoni këtë skript në Supabase SQL Editor

-- 1. Shtimi i fushave të reja në tabelën e taskave (për TSK prefix)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS assigned_by TEXT;

-- 2. Shtimi i fushave të reja në tabelën e shërbimeve (për SRV prefix)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS assigned_by TEXT,
ADD COLUMN IF NOT EXISTS warranty_info TEXT;

-- 3. Shtimi i fushave të reja në tabelën e porosive (për PRS prefix)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS team_notes TEXT;

-- 4. Shtimi i fushave të reja në tabelën e përdoruesve
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department TEXT;

-- 5. Krijimi i tabelës së tiketave (TIK prefix)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Email', 'Phone', 'Website', 'Social Media', 'In Person', 'Internal')),
  created_by TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting-customer', 'resolved', 'closed')),
  description TEXT,
  assigned_to TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  related_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Krijimi i tabelës së komenteve të tiketave
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Krijimi i tabelës së historisë së tiketave
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Krijimi i tabelës së media files (për Dizajner)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  uploaded_by TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- 9. Krijimi i tabelës së media calendar events
CREATE TABLE IF NOT EXISTS media_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID REFERENCES media_files(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('upload', 'review', 'publish', 'reject')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Shtimi i indekseve për performancë
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(status);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);

CREATE INDEX IF NOT EXISTS idx_media_calendar_event_date ON media_calendar(event_date);
CREATE INDEX IF NOT EXISTS idx_media_calendar_media_id ON media_calendar(media_id);

-- 11. Aktivizimi i RLS për tabelat e reja
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_calendar ENABLE ROW LEVEL SECURITY;

-- 12. Politikat e sigurisë për tabelat e reja
CREATE POLICY "Authenticated users can read all tickets" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all ticket comments" ON ticket_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all ticket history" ON ticket_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all media files" ON media_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all media calendar" ON media_calendar FOR SELECT TO authenticated USING (true);

-- 13. Funksioni për gjenerimin e ID-ve me prefiks
CREATE OR REPLACE FUNCTION generate_id_with_prefix(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER;
BEGIN
  -- Merr numrin e fundit për këtë prefiks
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO counter
  FROM (
    SELECT id FROM tasks WHERE id LIKE prefix || '%'
    UNION ALL
    SELECT id FROM services WHERE id LIKE prefix || '%'
    UNION ALL
    SELECT id FROM orders WHERE id LIKE prefix || '%'
    UNION ALL
    SELECT id FROM tickets WHERE id LIKE prefix || '%'
  ) all_ids;
  
  -- Krijon ID-në e re
  new_id := prefix || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 14. Trigger për gjenerimin automatik të ID-ve
CREATE OR REPLACE FUNCTION set_task_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_id_with_prefix('TSK');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_service_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_id_with_prefix('SRV');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_id_with_prefix('PRS');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_id_with_prefix('TIK');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Krijimi i trigger-eve
DROP TRIGGER IF EXISTS trigger_set_task_id ON tasks;
CREATE TRIGGER trigger_set_task_id
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_id();

DROP TRIGGER IF EXISTS trigger_set_service_id ON services;
CREATE TRIGGER trigger_set_service_id
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION set_service_id();

DROP TRIGGER IF EXISTS trigger_set_order_id ON orders;
CREATE TRIGGER trigger_set_order_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_id();

DROP TRIGGER IF EXISTS trigger_set_ticket_id ON tickets;
CREATE TRIGGER trigger_set_ticket_id
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_id();
