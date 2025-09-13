-- Update existing table statuses to use the new status system
-- Set all tables to available by default since we added the column with that default
-- Table T20 should be out_of_service since it's for takeout only
UPDATE public.tables 
SET status = 'out_of_service' 
WHERE label = 'T20';

-- All other tables remain available (default value)
-- No other updates needed since the default is 'available'
