-- Create reservations table
CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','cancelled','seated','completed');

CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  reserved_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.reservation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Users can manage their reservations
CREATE POLICY "Users manage own reservations"
  ON public.reservations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Staff (authenticated role) can view and update all reservations
CREATE POLICY "Staff can manage reservations"
  ON public.reservations
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
