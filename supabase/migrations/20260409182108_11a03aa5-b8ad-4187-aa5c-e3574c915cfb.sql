
-- Add referee field to tournaments
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS referee_name text;
