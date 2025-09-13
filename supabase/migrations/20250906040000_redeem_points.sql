-- Add function to redeem loyalty points
CREATE OR REPLACE FUNCTION public.redeem_points(p_user_id uuid, amount integer, reason text, metadata jsonb DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points integer;
  new_points integer;
BEGIN
  -- Safety checks
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Only authenticated users can redeem points';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: user mismatch';
  END IF;
  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'Invalid redemption amount';
  END IF;

  -- Get current points balance
  SELECT points INTO current_points
  FROM public.loyalty_points
  WHERE user_id = p_user_id;

  -- If no record exists, current points is 0
  IF current_points IS NULL THEN
    current_points := 0;
  END IF;

  -- Check if user has enough points
  IF current_points < amount THEN
    RAISE EXCEPTION 'Insufficient points balance. Available: %, Requested: %', current_points, amount;
  END IF;

  -- Deduct points (negative delta)
  INSERT INTO public.loyalty_points AS lp (user_id, points)
  VALUES (p_user_id, -amount)
  ON CONFLICT (user_id)
  DO UPDATE SET points = lp.points - amount, updated_at = now()
  RETURNING points INTO new_points;

  -- Record the transaction with negative delta
  INSERT INTO public.loyalty_transactions(user_id, delta, reason, metadata)
  VALUES (p_user_id, -amount, reason, metadata);

  RETURN new_points;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_points(uuid, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_points(uuid, integer, text, jsonb) TO authenticated;

-- Add function to get user's current points balance
CREATE OR REPLACE FUNCTION public.get_user_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_points integer;
BEGIN
  -- Safety checks
  IF auth.role() <> 'authenticated' THEN
    RAISE EXCEPTION 'Only authenticated users can view points';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Forbidden: user mismatch';
  END IF;

  -- Get current points balance
  SELECT points INTO user_points
  FROM public.loyalty_points
  WHERE user_id = p_user_id;

  -- If no record exists, return 0
  IF user_points IS NULL THEN
    user_points := 0;
  END IF;

  RETURN user_points;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_points(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_points(uuid) TO authenticated;
