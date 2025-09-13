-- Add loyalty points field to dishes table
-- This allows customizable loyalty points per product

ALTER TABLE public.dishes 
ADD COLUMN loyalty_points INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.dishes.loyalty_points IS 'Custom loyalty points awarded for this dish (overrides default calculation if set)';

-- Update existing dishes to use default calculation (NULL means use default)
-- Default behavior will be maintained for existing products
