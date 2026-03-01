
-- Add tournament logo, venue info columns
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS max_teams INTEGER,
ADD COLUMN IF NOT EXISTS accept_join_requests BOOLEAN DEFAULT false;

-- Add match_time to matches
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS match_time TEXT;

-- Create join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_logo_url TEXT,
  player_names TEXT[] DEFAULT '{}',
  player_photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for join_requests
CREATE POLICY "Anyone can view join requests" ON public.join_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create join requests" ON public.join_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Tournament owners can update join requests" ON public.join_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);
CREATE POLICY "Tournament owners can delete join requests" ON public.join_requests FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- Create storage bucket for tournament assets
INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-assets', 'tournament-assets', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view tournament assets" ON storage.objects FOR SELECT USING (bucket_id = 'tournament-assets');
CREATE POLICY "Authenticated users can upload tournament assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tournament-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their tournament assets" ON storage.objects FOR UPDATE USING (bucket_id = 'tournament-assets' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their tournament assets" ON storage.objects FOR DELETE USING (bucket_id = 'tournament-assets' AND auth.uid() IS NOT NULL);

-- Enable realtime for join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
