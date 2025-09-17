-- Add source field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'Manual';

-- Update existing products based on woo_commerce_id
UPDATE products 
SET source = CASE 
    WHEN woo_commerce_id IS NOT NULL THEN 'WooCommerce'
    ELSE 'Manual'
END;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
