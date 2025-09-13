-- Add order notification field to dishes table
-- This allows customizable order confirmation messages per product

ALTER TABLE public.dishes 
ADD COLUMN order_notification TEXT DEFAULT NULL;

COMMENT ON COLUMN public.dishes.order_notification IS 'Custom order confirmation message for this dish (overrides default if set)';
