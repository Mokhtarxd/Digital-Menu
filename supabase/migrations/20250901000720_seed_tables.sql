-- Seed 10 restaurant tables (idempotent by label)

INSERT INTO public.tables (label, seats, location)
SELECT 'T1', 2, 'Main'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T1');

INSERT INTO public.tables (label, seats, location)
SELECT 'T2', 2, 'Main'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T2');

INSERT INTO public.tables (label, seats, location)
SELECT 'T3', 4, 'Main'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T3');

INSERT INTO public.tables (label, seats, location)
SELECT 'T4', 4, 'Main'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T4');

INSERT INTO public.tables (label, seats, location)
SELECT 'T5', 4, 'Patio'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T5');

INSERT INTO public.tables (label, seats, location)
SELECT 'T6', 6, 'Patio'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T6');

INSERT INTO public.tables (label, seats, location)
SELECT 'T7', 2, 'Window'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T7');

INSERT INTO public.tables (label, seats, location)
SELECT 'T8', 8, 'Private'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T8');

INSERT INTO public.tables (label, seats, location)
SELECT 'T9', 2, 'Bar'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T9');

INSERT INTO public.tables (label, seats, location)
SELECT 'T10', 4, 'Bar'
WHERE NOT EXISTS (SELECT 1 FROM public.tables WHERE label = 'T10');
