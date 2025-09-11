-- Add WooCommerce integration columns to products table only
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS woo_commerce_id INTEGER,
ADD COLUMN IF NOT EXISTS woo_commerce_status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS woo_commerce_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for WooCommerce ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_woo_commerce_id ON products(woo_commerce_id);

-- Add index for sync date
CREATE INDEX IF NOT EXISTS idx_products_last_sync_date ON products(last_sync_date);
