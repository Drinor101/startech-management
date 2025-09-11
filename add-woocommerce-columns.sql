-- Add WooCommerce integration columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS woo_commerce_id INTEGER,
ADD COLUMN IF NOT EXISTS woo_commerce_status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS woo_commerce_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Add WooCommerce integration columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS woo_commerce_id INTEGER,
ADD COLUMN IF NOT EXISTS woo_commerce_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Add WooCommerce integration columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Manual';

-- Add indexes for WooCommerce ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_woo_commerce_id ON products(woo_commerce_id);
CREATE INDEX IF NOT EXISTS idx_orders_woo_commerce_id ON orders(woo_commerce_id);

-- Add indexes for sync dates
CREATE INDEX IF NOT EXISTS idx_products_last_sync_date ON products(last_sync_date);
CREATE INDEX IF NOT EXISTS idx_orders_last_sync_date ON orders(last_sync_date);
