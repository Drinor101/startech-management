-- Skema e bazës së të dhënave për Startech
-- Ekzekutoni këtë skript në Supabase SQL Editor

-- Tabela e produkteve
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  supplier TEXT,
  woo_commerce_status TEXT DEFAULT 'draft' CHECK (woo_commerce_status IN ('active', 'inactive', 'draft')),
  woo_commerce_category TEXT,
  last_sync_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e klientëve
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  source TEXT DEFAULT 'Internal' CHECK (source IN ('WooCommerce', 'Internal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e porosive
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  source TEXT DEFAULT 'Manual' CHECK (source IN ('Manual', 'WooCommerce')),
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_zip_code TEXT,
  shipping_method TEXT,
  total DECIMAL(10,2) NOT NULL,
  is_editable BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e produkteve të porosisë
CREATE TABLE IF NOT EXISTS order_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e shërbimeve
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  problem_description TEXT NOT NULL,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'in-progress', 'waiting-parts', 'completed', 'delivered')),
  category TEXT,
  assigned_to TEXT,
  reception_point TEXT,
  under_warranty BOOLEAN DEFAULT false,
  qr_code TEXT,
  email_notifications_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela e historisë së shërbimeve
CREATE TABLE IF NOT EXISTS service_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e taskave
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('task', 'ticket')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT,
  visible_to TEXT[],
  category TEXT,
  department TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  related_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  source TEXT CHECK (source IN ('Email', 'Phone', 'Website', 'Social Media', 'In Person', 'Internal')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela e komenteve të taskave
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e historisë së taskave
CREATE TABLE IF NOT EXISTS task_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e përdoruesve
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'Administrator', 'Manager', 'Technician', 'Support Agent', 'Design', 'Marketing', 'E-commerce')),
  name TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela e aksioneve të përdoruesve
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET
);

-- Aktivizimi i Row Level Security për të gjitha tabelat
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Politikat e sigurisë për të gjitha tabelat
-- Të gjithë përdoruesit e autentifikuar mund të lexojnë të gjitha të dhënat
CREATE POLICY "Authenticated users can read all data" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON order_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON service_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON task_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all data" ON user_actions FOR SELECT TO authenticated USING (true);

-- Të gjithë përdoruesit e autentifikuar mund të krijojnë të dhëna
CREATE POLICY "Authenticated users can insert data" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON order_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON service_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON task_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON task_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert data" ON user_actions FOR INSERT TO authenticated WITH CHECK (true);

-- Të gjithë përdoruesit e autentifikuar mund të përditësojnë të dhëna
CREATE POLICY "Authenticated users can update data" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON order_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON service_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON task_comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON task_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update data" ON user_actions FOR UPDATE TO authenticated USING (true);

-- Të gjithë përdoruesit e autentifikuar mund të fshijnë të dhëna
CREATE POLICY "Authenticated users can delete data" ON products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON customers FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON orders FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON order_products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON services FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON service_history FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON tasks FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON task_comments FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON task_history FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON user_actions FOR DELETE TO authenticated USING (true);

-- Lejimet për anon dhe authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.orders TO anon, authenticated;
GRANT ALL ON public.order_products TO anon, authenticated;
GRANT ALL ON public.services TO anon, authenticated;
GRANT ALL ON public.service_history TO anon, authenticated;
GRANT ALL ON public.tasks TO anon, authenticated;
GRANT ALL ON public.task_comments TO anon, authenticated;
GRANT ALL ON public.task_history TO anon, authenticated;
GRANT ALL ON public.user_actions TO anon, authenticated;
