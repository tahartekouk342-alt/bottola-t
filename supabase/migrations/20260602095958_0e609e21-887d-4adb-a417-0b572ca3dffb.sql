
-- Tournament: registration mode + auto draw
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS registration_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS registration_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS registration_open boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_draw_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_empty boolean NOT NULL DEFAULT false;

-- Profile-level default
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auto_draw_default boolean NOT NULL DEFAULT true;

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_token ON public.tournaments(registration_token) WHERE registration_token IS NOT NULL;

-- Trigger to auto-close registration when max teams reached
CREATE OR REPLACE FUNCTION public.check_tournament_registration_full()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_max int;
  v_open boolean;
BEGIN
  SELECT max_teams, registration_open INTO v_max, v_open
  FROM public.tournaments WHERE id = NEW.tournament_id;
  IF v_open AND v_max IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.teams WHERE tournament_id = NEW.tournament_id;
    IF v_count >= v_max THEN
      UPDATE public.tournaments SET registration_open = false WHERE id = NEW.tournament_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_tournament_registration_full ON public.teams;
CREATE TRIGGER trg_check_tournament_registration_full
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.check_tournament_registration_full();
