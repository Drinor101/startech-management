-- Fix WooCommerce products that have Manual source but WooCommerce ID
-- These should have source = 'WooCommerce' instead of 'Manual'

UPDATE products 
SET source = 'WooCommerce' 
WHERE woo_commerce_id IS NOT NULL 
  AND source = 'Manual';

-- Verify the fix
SELECT id, title, source, woo_commerce_id 
FROM products 
WHERE woo_commerce_id IS NOT NULL;
