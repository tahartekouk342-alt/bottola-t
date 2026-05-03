-- Add 'league' to tournament_type enum
ALTER TYPE tournament_type ADD VALUE IF NOT EXISTS 'league';

-- League configuration columns on tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS league_legs smallint NOT NULL DEFAULT 1, -- 1=ذهاب فقط، 2=ذهاب وإياب
  ADD COLUMN IF NOT EXISTS has_playoff boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS playoff_teams smallint NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS playoff_started boolean NOT NULL DEFAULT false;

-- Mark league leg on matches (1 = ذهاب, 2 = إياب)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS leg smallint NOT NULL DEFAULT 1;

-- Default join requests OFF (we are removing the feature)
ALTER TABLE public.tournaments
  ALTER COLUMN accept_join_requests SET DEFAULT false;