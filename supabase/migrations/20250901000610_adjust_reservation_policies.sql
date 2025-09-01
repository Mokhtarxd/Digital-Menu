-- Align reservations RLS policies to the requested set

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Drop legacy/conflicting policies if present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Users manage own reservations'
  ) THEN
    DROP POLICY "Users manage own reservations" ON public.reservations;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Staff can manage reservations'
  ) THEN
    DROP POLICY "Staff can manage reservations" ON public.reservations;
  END IF;
END $$;

-- Authenticated can insert own reservations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Authenticated can insert own reservations'
  ) THEN
    CREATE POLICY "Authenticated can insert own reservations"
      ON public.reservations
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
  END IF;
END $$;

-- Users can select their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Users can select their own'
  ) THEN
    CREATE POLICY "Users can select their own"
      ON public.reservations
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Users can update their own'
  ) THEN
    CREATE POLICY "Users can update their own"
      ON public.reservations
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can delete their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Users can delete their own'
  ) THEN
    CREATE POLICY "Users can delete their own"
      ON public.reservations
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Public can insert reservations with client header (ensure present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Public can insert reservations with client header'
  ) THEN
    CREATE POLICY "Public can insert reservations with client header"
      ON public.reservations
      FOR INSERT
      WITH CHECK (
        nullif(current_setting('request.header.x-client-id', true), '') IS NOT NULL
        AND client_id = nullif(current_setting('request.header.x-client-id', true), '')
      );
  END IF;
END $$;

-- Public can view reservations by client header (ensure present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Public can view reservations by client header'
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

-- Authenticated can manage reservations (broad access to all rows)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Authenticated can manage reservations'
  ) THEN
    CREATE POLICY "Authenticated can manage reservations"
      ON public.reservations
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
