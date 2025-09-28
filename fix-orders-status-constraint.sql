-- Fix orders status constraint to include 'accepted'
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'accepted' included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'));
