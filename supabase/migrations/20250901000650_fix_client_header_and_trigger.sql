-- Robust client header handling and trigger defaulting for client_id

-- Helper to fetch the X-Client-Id header reliably from PostgREST
CREATE OR REPLACE FUNCTION public.req_client_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.header.x-client-id', true), ''),
    NULLIF((current_setting('request.headers', true)::json ->> 'x-client-id'), '')
  );
$$;

-- BEFORE INSERT trigger to set client_id from header if missing
CREATE OR REPLACE FUNCTION public.set_reservation_client_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.client_id IS NULL THEN
    NEW.client_id := public.req_client_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_set_client_id ON public.reservations;
CREATE TRIGGER reservations_set_client_id
BEFORE INSERT ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.set_reservation_client_id();

-- Update public policies to use the helper
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Public can insert reservations with client header'
  ) THEN
    DROP POLICY "Public can insert reservations with client header" ON public.reservations;
  END IF;
END $$;

CREATE POLICY "Public can insert reservations with client header"
  ON public.reservations
  FOR INSERT
  WITH CHECK (
    public.req_client_id() IS NOT NULL AND client_id = public.req_client_id()
  );

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Public can view reservations by client header'
  ) THEN
    DROP POLICY "Public can view reservations by client header" ON public.reservations;
  END IF;
END $$;

CREATE POLICY "Public can view reservations by client header"
  ON public.reservations
  FOR SELECT
  USING (
    public.req_client_id() IS NOT NULL AND client_id = public.req_client_id()
  );
