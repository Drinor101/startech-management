-- Fix orders source constraint to allow 'WooCommerce' instead of 'Woo'
-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;

-- Add the new constraint
ALTER TABLE orders ADD CONSTRAINT orders_source_check CHECK (source IN ('Manual', 'WooCommerce'));

-- Update any existing 'Woo' values to 'WooCommerce' if they exist
UPDATE orders SET source = 'WooCommerce' WHERE source = 'Woo';
