-- Reassert the stock column and force PostgREST to reload the schema cache.
BEGIN;

ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.dishes.stock IS 'Current available stock remaining for the dish.';

-- Ensure the runtime API is aware of the new column immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
