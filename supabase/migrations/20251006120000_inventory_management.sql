-- Add stock column to dishes and provide inventory adjustment helper
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.dishes.stock IS 'Current available stock remaining for the dish.';

-- Bring existing rows in line with the new column. Keep currently available dishes in stock and mark
-- unavailable ones as empty so the previous behaviour is preserved.
UPDATE public.dishes
SET stock = CASE
  WHEN is_available IS TRUE THEN 50
  ELSE 0
END
WHERE stock = 0;

-- Expose an inventory helper so the frontend can atomically update stock while respecting RLS.
CREATE OR REPLACE FUNCTION public.adjust_inventory(_items jsonb)
RETURNS TABLE(dish_id uuid, stock integer, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  target uuid;
  delta integer;
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' THEN
    RETURN;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    target := NULL;
    delta := 0;

    IF item ? 'id' THEN
      target := (item ->> 'id')::uuid;
    END IF;

    IF item ? 'delta' THEN
      delta := COALESCE((item ->> 'delta')::integer, 0);
    END IF;

    IF target IS NULL OR delta = 0 THEN
      CONTINUE;
    END IF;

    UPDATE public.dishes AS d
    SET stock = GREATEST(COALESCE(d.stock, 0) + delta, 0),
        is_available = GREATEST(COALESCE(d.stock, 0) + delta, 0) > 0,
        updated_at = now()
    WHERE d.id = target
    RETURNING d.id, d.stock, d.is_available
    INTO dish_id, stock, is_available;

    IF FOUND THEN
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_inventory(jsonb) TO anon, authenticated;
