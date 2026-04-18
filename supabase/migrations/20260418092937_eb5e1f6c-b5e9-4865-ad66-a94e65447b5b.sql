-- News feed for organizers
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  media_types text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Only organizers can view posts
CREATE POLICY "Organizers view posts" ON public.posts FOR SELECT
  USING (public.has_role(auth.uid(), 'organizer'));

CREATE POLICY "Organizers create posts" ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), 'organizer'));

CREATE POLICY "Authors update posts" ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors delete posts" ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- Reactions
CREATE POLICY "Organizers view reactions" ON public.post_reactions FOR SELECT
  USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers add reactions" ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Users remove their reactions" ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Organizers view comments" ON public.post_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers add comments" ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Authors delete comments" ON public.post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Shares
CREATE POLICY "Organizers view shares" ON public.post_shares FOR SELECT
  USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers share" ON public.post_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Users remove their shares" ON public.post_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket for posts media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('posts-media', 'posts-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read posts media" ON storage.objects FOR SELECT
  USING (bucket_id = 'posts-media');
CREATE POLICY "Organizers upload posts media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Owners update posts media" ON storage.objects FOR UPDATE
  USING (bucket_id = 'posts-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete posts media" ON storage.objects FOR DELETE
  USING (bucket_id = 'posts-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;