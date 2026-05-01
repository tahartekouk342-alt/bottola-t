-- 1) Add 'volleyball' to sport_type enum
ALTER TYPE public.sport_type ADD VALUE IF NOT EXISTS 'volleyball';

-- 2) Tournament: volleyball format + age category + completion timestamp + archived flag
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS volleyball_format text,
  ADD COLUMN IF NOT EXISTS age_category text,
  ADD COLUMN IF NOT EXISTS season text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Trigger to set completed_at automatically when status -> completed
CREATE OR REPLACE FUNCTION public.set_tournament_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_tournament_completed_at ON public.tournaments;
CREATE TRIGGER trg_tournament_completed_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW EXECUTE FUNCTION public.set_tournament_completed_at();

-- 3) Volleyball match scoring (sets)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS home_sets integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS away_sets integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sets_detail jsonb;

-- 4) Players: birth_date so we can validate against age category
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS birth_date date;

-- 5) Organizer-wide unified player pool (prevents same player in two age categories within a season)
CREATE TABLE IF NOT EXISTS public.player_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  full_name text NOT NULL,
  birth_date date,
  photo_url text,
  season text NOT NULL DEFAULT to_char(now(), 'YYYY'),
  age_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, full_name, season)
);

ALTER TABLE public.player_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player pool"
  ON public.player_pool FOR SELECT USING (true);

CREATE POLICY "Organizer manages own pool insert"
  ON public.player_pool FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizer manages own pool update"
  ON public.player_pool FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizer manages own pool delete"
  ON public.player_pool FOR DELETE
  USING (auth.uid() = organizer_id);

CREATE INDEX IF NOT EXISTS idx_player_pool_org_season ON public.player_pool(organizer_id, season);

-- 6) News media: allow ANY file type metadata (already have media_urls + media_types arrays — add file_names for non-image/video files)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS file_names text[] DEFAULT '{}'::text[];