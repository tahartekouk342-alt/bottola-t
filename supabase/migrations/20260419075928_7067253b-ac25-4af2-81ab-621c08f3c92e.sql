-- Allow everyone to read posts and engagement; keep writes restricted

DROP POLICY IF EXISTS "Organizers view posts" ON public.posts;
CREATE POLICY "Anyone can view posts"
ON public.posts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Organizers view reactions" ON public.post_reactions;
CREATE POLICY "Anyone can view reactions"
ON public.post_reactions FOR SELECT
USING (true);

-- Allow any authenticated user (organizer or viewer) to react
DROP POLICY IF EXISTS "Organizers add reactions" ON public.post_reactions;
CREATE POLICY "Authenticated users add reactions"
ON public.post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers view comments" ON public.post_comments;
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Organizers add comments" ON public.post_comments;
CREATE POLICY "Authenticated users add comments"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Organizers view shares" ON public.post_shares;
CREATE POLICY "Anyone can view shares"
ON public.post_shares FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Organizers share" ON public.post_shares;
CREATE POLICY "Authenticated users share"
ON public.post_shares FOR INSERT
WITH CHECK (auth.uid() = user_id);