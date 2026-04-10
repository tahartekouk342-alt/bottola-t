-- Add sport type to tournaments
CREATE TYPE public.sport_type AS ENUM ('football', 'basketball');

ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS sport_type sport_type NOT NULL DEFAULT 'football';