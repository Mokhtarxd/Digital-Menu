-- Add is_hidden column to dishes table
-- This will allow products to be completely hidden from customers while keeping availability separate

ALTER TABLE public.dishes
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.dishes.is_hidden IS 'When true, the dish is completely hidden from customers. Different from is_available which shows out-of-stock items.';

-- Update the public policy to exclude hidden dishes from customer view
DROP POLICY "Public can view dishes" ON public.dishes;

CREATE POLICY "Public can view dishes"
  ON public.dishes
  FOR SELECT
  USING (is_hidden = false);
