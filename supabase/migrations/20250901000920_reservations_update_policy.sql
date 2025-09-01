-- Allow anon device (by client header) or authenticated owner to update their own reservations (e.g., cancel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='reservations' AND policyname='Anon device can update own reservations'
  ) THEN
    CREATE POLICY "Anon device can update own reservations" ON public.reservations
      FOR UPDATE
      USING (
        (
          auth.role() = 'anon' 
          AND public.req_client_id() IS NOT NULL 
          AND public.req_client_id() = client_id
        )
        OR (
          auth.uid() IS NOT NULL AND auth.uid() = user_id
        )
      )
      WITH CHECK (
        (
          auth.role() = 'anon' 
          AND public.req_client_id() IS NOT NULL 
          AND public.req_client_id() = client_id
        )
        OR (
          auth.uid() IS NOT NULL AND auth.uid() = user_id
        )
      );
  END IF;
END$$;
