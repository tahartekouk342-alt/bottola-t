
-- Cards on matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS cards JSONB DEFAULT '[]'::jsonb;

-- Tournament scheduling parameters
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS match_duration_minutes INTEGER DEFAULT 90;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS rest_minutes INTEGER DEFAULT 60;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS daily_start_time TEXT DEFAULT '16:00';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS daily_end_time TEXT DEFAULT '22:00';

-- Team staff (coaches / management)
CREATE TABLE IF NOT EXISTS public.team_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'coach',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team staff" ON public.team_staff FOR SELECT USING (true);
CREATE POLICY "Anyone can insert team staff" ON public.team_staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update team staff" ON public.team_staff FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete team staff" ON public.team_staff FOR DELETE USING (true);

-- Add nickname/last_name to players if not present (for "لقب")
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add nickname to teams (for "لقب الفريق")
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS sport_type TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS age_category TEXT;

-- Add owner/organizer reference for standalone teams (not bound to a tournament)
ALTER TABLE public.teams ALTER COLUMN tournament_id DROP NOT NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS organizer_id UUID;
