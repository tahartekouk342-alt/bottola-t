
-- Add man of the match to matches
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS man_of_match_name text;

-- Add captain flag to players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS is_captain boolean NOT NULL DEFAULT false;
