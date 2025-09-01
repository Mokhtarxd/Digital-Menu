-- Allow anonymous/public inserts into reservations for QR/WhatsApp flow
-- RLS remains enabled; this policy only grants INSERT to anon and authenticated users

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy for public
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reservations' AND policyname = 'Public can insert reservations'
  ) THEN
    CREATE POLICY "Public can insert reservations"
      ON public.reservations
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
