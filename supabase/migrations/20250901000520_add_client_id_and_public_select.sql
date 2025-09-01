-- Add client_id to reservations and allow anonymous users to view only their own reservations via a per-device header
-- This uses PostgREST GUCs: current_setting('request.header.x-client-id', true)

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS client_id TEXT;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Replace the permissive public insert policy with one that ties the row to the client header
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'Public can insert reservations'
  ) THEN
    DROP POLICY "Public can insert reservations" ON public.reservations;
  END IF;
END $$;

CREATE POLICY "Public can insert reservations with client header"
  ON public.reservations
  FOR INSERT
  WITH CHECK (
    nullif(current_setting('request.header.x-client-id', true), '') IS NOT NULL
    AND client_id = nullif(current_setting('request.header.x-client-id', true), '')
  );

-- Allow public to SELECT only rows matching their X-Client-Id header
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'Public can view reservations by client header'
  ) THEN
    CREATE POLICY "Public can view reservations by client header"
      ON public.reservations
      FOR SELECT
      USING (
        nullif(current_setting('request.header.x-client-id', true), '') IS NOT NULL
        AND client_id = nullif(current_setting('request.header.x-client-id', true), '')
      );
  END IF;
END $$;
