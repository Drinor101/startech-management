-- Add dummy data for testing
-- Run this in Supabase SQL Editor

-- Add dummy customers
INSERT INTO public.customers (id, name, email, phone, address, source) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Ahmet Krasniqi', 'ahmet@example.com', '+383 44 111 111', 'Prishtinë, Kosovë', 'Internal'),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Fatime Berisha', 'fatime@example.com', '+383 44 222 222', 'Prizren, Kosovë', 'Internal'),
('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Bardhyl Hoxha', 'bardhyl@example.com', '+383 44 333 333', 'Pejë, Kosovë', 'WooCommerce'),
('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Valmira Rexhepi', 'valmira@example.com', '+383 44 444 444', 'Gjakovë, Kosovë', 'Internal'),
('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Driton Bajrami', 'driton@example.com', '+383 44 555 555', 'Mitrovicë, Kosovë', 'WooCommerce')
ON CONFLICT (id) DO NOTHING;

-- Add dummy products
INSERT INTO public.products (id, image, title, category, base_price, additional_cost, final_price, supplier, woo_commerce_status) VALUES
('660e8400-e29b-41d4-a716-446655440001'::uuid, 'https://via.placeholder.com/300x200?text=Laptop', 'Dell Latitude 5520', 'Laptops', 899.99, 50.00, 949.99, 'Dell', 'active'),
('660e8400-e29b-41d4-a716-446655440002'::uuid, 'https://via.placeholder.com/300x200?text=Printer', 'HP LaserJet Pro M404n', 'Printers', 299.99, 25.00, 324.99, 'HP', 'active'),
('660e8400-e29b-41d4-a716-446655440003'::uuid, 'https://via.placeholder.com/300x200?text=Monitor', 'Samsung 24" Monitor', 'Monitors', 199.99, 0.00, 199.99, 'Samsung', 'active'),
('660e8400-e29b-41d4-a716-446655440004'::uuid, 'https://via.placeholder.com/300x200?text=Keyboard', 'Logitech Wireless Keyboard', 'Accessories', 49.99, 5.00, 54.99, 'Logitech', 'active'),
('660e8400-e29b-41d4-a716-446655440005'::uuid, 'https://via.placeholder.com/300x200?text=Mouse', 'Microsoft Wireless Mouse', 'Accessories', 29.99, 0.00, 29.99, 'Microsoft', 'active')
ON CONFLICT (id) DO NOTHING;

-- Add dummy orders
INSERT INTO public.orders (id, customer_id, status, source, shipping_address, shipping_city, shipping_zip_code, shipping_method, total, notes) VALUES
('ORD-2024-001', '550e8400-e29b-41d4-a716-446655440001'::uuid, 'delivered', 'Manual', 'Rr. Nëna Terezë 15', 'Prishtinë', '10000', 'Express', 949.99, 'Laptop për zyra'),
('ORD-2024-002', '550e8400-e29b-41d4-a716-446655440002'::uuid, 'processing', 'Manual', 'Rr. Adem Jashari 8', 'Prizren', '20000', 'Standard', 324.99, 'Printer për shtëpi'),
('ORD-2024-003', '550e8400-e29b-41d4-a716-446655440003'::uuid, 'shipped', 'Woo', 'Rr. Isa Boletini 22', 'Pejë', '30000', 'Express', 199.99, 'Monitor për gaming'),
('ORD-2024-004', '550e8400-e29b-41d4-a716-446655440004'::uuid, 'pending', 'Manual', 'Rr. Gjergj Kastrioti 12', 'Gjakovë', '50000', 'Standard', 84.98, 'Accessories për laptop'),
('ORD-2024-005', '550e8400-e29b-41d4-a716-446655440005'::uuid, 'delivered', 'Woo', 'Rr. Skënderbeu 5', 'Mitrovicë', '40000', 'Express', 29.99, 'Mouse wireless')
ON CONFLICT (id) DO NOTHING;

-- Add dummy order products
INSERT INTO public.order_products (order_id, product_id, quantity, subtotal) VALUES
('ORD-2024-001', '660e8400-e29b-41d4-a716-446655440001'::uuid, 1, 949.99),
('ORD-2024-002', '660e8400-e29b-41d4-a716-446655440002'::uuid, 1, 324.99),
('ORD-2024-003', '660e8400-e29b-41d4-a716-446655440003'::uuid, 1, 199.99),
('ORD-2024-004', '660e8400-e29b-41d4-a716-446655440004'::uuid, 1, 54.99),
('ORD-2024-004', '660e8400-e29b-41d4-a716-446655440005'::uuid, 1, 29.99),
('ORD-2024-005', '660e8400-e29b-41d4-a716-446655440005'::uuid, 1, 29.99)
ON CONFLICT DO NOTHING;

-- Add dummy services
INSERT INTO public.services (id, customer_id, order_id, problem_description, status, category, assigned_to, reception_point, under_warranty) VALUES
('SRV-2024-001', '550e8400-e29b-41d4-a716-446655440001'::uuid, 'ORD-2024-001', 'Laptop nuk ndizet, ekrani i zi', 'in-progress', 'Hardware', 'drini', 'Prishtinë', true),
('SRV-2024-002', '550e8400-e29b-41d4-a716-446655440002'::uuid, 'ORD-2024-002', 'Printer printon vija të zeza', 'waiting-parts', 'Hardware', 'drini', 'Prizren', false),
('SRV-2024-003', '550e8400-e29b-41d4-a716-446655440003'::uuid, NULL, 'Monitor ka piksela të vdekur', 'completed', 'Hardware', 'drini', 'Pejë', true),
('SRV-2024-004', '550e8400-e29b-41d4-a716-446655440004'::uuid, NULL, 'Keyboard ka taste që nuk punojnë', 'received', 'Hardware', 'drini', 'Gjakovë', false),
('SRV-2024-005', '550e8400-e29b-41d4-a716-446655440005'::uuid, NULL, 'Mouse nuk lëviz mire', 'delivered', 'Hardware', 'drini', 'Mitrovicë', true)
ON CONFLICT (id) DO NOTHING;

-- Add dummy tasks
INSERT INTO public.tasks (id, type, title, description, priority, assigned_to, visible_to, category, department, status, customer_id, source) VALUES
('TASK-2024-001', 'task', 'Instalimi i Windows 11', 'Instalo Windows 11 në laptop të ri', 'medium', 'drini', ARRAY['admin', 'user'], 'Software', 'IT', 'in-progress', '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Internal'),
('TASK-2024-002', 'ticket', 'Problemi me internet', 'Klienti ka probleme me lidhjen e internetit', 'high', 'drini', ARRAY['admin', 'user'], 'Network', 'IT', 'todo', '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Email'),
('TASK-2024-003', 'task', 'Backup i të dhënave', 'Bëj backup të të dhënave të rëndësishme', 'urgent', 'drini', ARRAY['admin'], 'Data', 'IT', 'done', '550e8400-e29b-41d4-a716-446655440003'::uuid, 'Internal'),
('TASK-2024-004', 'ticket', 'Virus në kompjuter', 'Klienti ka virus në kompjuter', 'high', 'drini', ARRAY['admin', 'user'], 'Security', 'IT', 'review', '550e8400-e29b-41d4-a716-446655440004'::uuid, 'Phone'),
('TASK-2024-005', 'task', 'Konfigurimi i printerit', 'Konfiguro printerin e ri', 'low', 'drini', ARRAY['admin', 'user'], 'Hardware', 'IT', 'todo', '550e8400-e29b-41d4-a716-446655440005'::uuid, 'Internal')
ON CONFLICT (id) DO NOTHING;

-- Add dummy service history
INSERT INTO public.service_history (service_id, action, notes, user_name) VALUES
('SRV-2024-001', 'Service received', 'Laptop u pranua për riparim', 'drini'),
('SRV-2024-001', 'Diagnosis started', 'Duke diagnostikuar problemin', 'drini'),
('SRV-2024-002', 'Service received', 'Printer u pranua për riparim', 'drini'),
('SRV-2024-003', 'Service completed', 'Monitor u riparua me sukses', 'drini'),
('SRV-2024-004', 'Service received', 'Keyboard u pranua për riparim', 'drini'),
('SRV-2024-005', 'Service delivered', 'Mouse u dorëzua klientit', 'drini')
ON CONFLICT DO NOTHING;

-- Add dummy task comments
INSERT INTO public.task_comments (task_id, user_name, message) VALUES
('TASK-2024-001', 'drini', 'Duke filluar instalimin e Windows 11'),
('TASK-2024-001', 'drini', 'Instalimi u përfundua me sukses'),
('TASK-2024-002', 'drini', 'Duke investiguar problemin e internetit'),
('TASK-2024-003', 'drini', 'Backup u bë me sukses'),
('TASK-2024-004', 'drini', 'Virusi u hoq me sukses'),
('TASK-2024-005', 'drini', 'Duke konfiguruar printerin')
ON CONFLICT DO NOTHING;

-- Add dummy task history
INSERT INTO public.task_history (task_id, action, user_name, details) VALUES
('TASK-2024-001', 'Task created', 'drini', 'Krijuar task për instalimin e Windows 11'),
('TASK-2024-001', 'Task started', 'drini', 'Filluar instalimi'),
('TASK-2024-002', 'Ticket created', 'drini', 'Krijuar ticket për problemin e internetit'),
('TASK-2024-003', 'Task completed', 'drini', 'Backup u përfundua'),
('TASK-2024-004', 'Task in review', 'drini', 'Duke kontrolluar rezultatet'),
('TASK-2024-005', 'Task assigned', 'drini', 'Task i caktuar për konfigurim')
ON CONFLICT DO NOTHING;

-- Add dummy user actions
INSERT INTO public.user_actions (user_name, action, module, details) VALUES
('drini', 'Login', 'Authentication', 'User logged in successfully'),
('drini', 'Create Service', 'Services', 'Created new service SRV-2024-001'),
('drini', 'Update Task', 'Tasks', 'Updated task TASK-2024-001 status'),
('drini', 'Create Order', 'Orders', 'Created new order ORD-2024-001'),
('drini', 'Add Customer', 'Customers', 'Added new customer Ahmet Krasniqi')
ON CONFLICT DO NOTHING;
