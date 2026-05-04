ALTER TYPE public.tournament_status ADD VALUE IF NOT EXISTS 'active';

ALTER TABLE public.tournaments
  ALTER COLUMN status SET DEFAULT 'draft'::public.tournament_status;