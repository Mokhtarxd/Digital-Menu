-- Loyalty points schema

CREATE TABLE IF NOT EXISTS public.loyalty_points (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own balance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_points' AND policyname='Users can view own loyalty balance'
  ) THEN
    CREATE POLICY "Users can view own loyalty balance"
      ON public.loyalty_points
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can view their own transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='loyalty_transactions' AND policyname='Users can view own loyalty transactions'
  ) THEN
    CREATE POLICY "Users can view own loyalty transactions"
      ON public.loyalty_transactions
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- No direct insert/update from clients; use RPC. (No policies for write.)

-- RPC to award points: authenticated user only and must match user_id
CREATE OR REPLACE FUNCTION public.award_points(p_user_id uuid, amount integer, reason text, metadata jsonb DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_points integer;
BEGIN
  -- Safety checks
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Only authenticated users can earn points';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: user mismatch';
  END IF;
  IF amount IS NULL OR amount <= 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.loyalty_points AS lp (user_id, points)
  VALUES (p_user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET points = lp.points + EXCLUDED.points, updated_at = now()
  RETURNING points INTO new_points;

  INSERT INTO public.loyalty_transactions(user_id, delta, reason, metadata)
  VALUES (p_user_id, amount, reason, metadata);

  RETURN new_points;
END;
$$;

REVOKE ALL ON FUNCTION public.award_points(uuid, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_points(uuid, integer, text, jsonb) TO authenticated;
