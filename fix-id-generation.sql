-- Fshi trigger-in e vjetër dhe krijon një të ri
DROP TRIGGER IF EXISTS trigger_set_service_id ON services;

-- Fshi funksionin e vjetër dhe krijon një të ri
DROP FUNCTION IF EXISTS generate_id_with_prefix(TEXT);

-- Krijon funksionin e ri për ID generation
CREATE OR REPLACE FUNCTION generate_id_with_prefix(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER;
  current_year TEXT;
  max_num INTEGER;
BEGIN
  -- Merr vitin aktual
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Merr numrin e fundit për këtë prefiks dhe vit
  SELECT COALESCE(MAX(CAST(regexp_replace(id, '^' || prefix || '-' || current_year || '-(\\d+)$', '\\1') AS INTEGER)), 0)
  INTO max_num
  FROM (
    SELECT id FROM tasks WHERE id ~ ('^' || prefix || '-' || current_year || '-\\d+$')
    UNION ALL
    SELECT id FROM services WHERE id ~ ('^' || prefix || '-' || current_year || '-\\d+$')
    UNION ALL
    SELECT id FROM orders WHERE id ~ ('^' || prefix || '-' || current_year || '-\\d+$')
    UNION ALL
    SELECT id FROM tickets WHERE id ~ ('^' || prefix || '-' || current_year || '-\\d+$')
  ) all_ids;
  
  -- Sigurohu që counter fillon nga 1, jo 0, dhe rritet saktë
  IF max_num = 0 THEN
    counter := 1;
  ELSE
    counter := max_num + 1;
  END IF;
  
  -- Krijon ID-në e re në format PREFIX-YYYY-NNN
  new_id := prefix || '-' || current_year || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Krijon trigger-in e ri
CREATE TRIGGER trigger_set_service_id
  BEFORE INSERT ON services
  FOR EACH ROW
  EXECUTE FUNCTION generate_id_with_prefix('SRV');

-- Testo funksionin
SELECT generate_id_with_prefix('SRV') as next_service_id;
SELECT generate_id_with_prefix('SRV') as next_service_id_2;
SELECT generate_id_with_prefix('SRV') as next_service_id_3;

-- Shiko servisat ekzistuese
SELECT id FROM services ORDER BY id;
