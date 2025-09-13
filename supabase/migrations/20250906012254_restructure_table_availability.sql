-- Remove the available_tables table and restructure table availability logic
-- Drop the available_tables table/view if it exists
DROP VIEW IF EXISTS public.available_tables CASCADE;
DROP TABLE IF EXISTS public.available_tables CASCADE;

-- Remove the is_available column from tables since we'll track this differently
ALTER TABLE public.tables DROP COLUMN IF EXISTS is_available;

-- Add status column to tables instead of separate availability tracking
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';

-- Add constraint to ensure valid statuses (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'tables_status_check'
    ) THEN
        ALTER TABLE public.tables ADD CONSTRAINT tables_status_check 
        CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'out_of_service'));
    END IF;
END $$;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);

-- Update existing policies to work with status instead of is_available
-- (The existing policies should still work as they just check authentication)
