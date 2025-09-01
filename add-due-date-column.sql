-- Add due_date column to tasks table
-- Run this in Supabase SQL Editor

-- Add due_date column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add comment to explain the column
COMMENT ON COLUMN public.tasks.due_date IS 'Due date for the task';
