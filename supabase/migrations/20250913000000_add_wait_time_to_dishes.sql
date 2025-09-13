-- Add wait_time column to dishes table

ALTER TABLE public.dishes
ADD COLUMN wait_time INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.dishes.wait_time IS 'Preparation time in minutes for this dish. If multiple dishes are ordered, the maximum wait time will be used.';
