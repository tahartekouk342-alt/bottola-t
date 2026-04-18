-- Notifications for post interactions (reactions, comments, shares)
CREATE OR REPLACE FUNCTION public.notify_post_author_on_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  post_author UUID;
  reactor_name TEXT;
  reaction_emoji TEXT;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO reactor_name FROM public.profiles WHERE user_id = NEW.user_id;
  reaction_emoji := CASE NEW.reaction
    WHEN 'love' THEN '❤️' WHEN 'haha' THEN '😂'
    WHEN 'sad' THEN '😢' WHEN 'wow' THEN '😮'
    ELSE '👍' END;
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (post_author, 'تفاعل جديد ' || reaction_emoji,
    COALESCE(reactor_name, 'مستخدم') || ' تفاعل مع منشورك', 'post_reaction');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_post_author_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author UUID; commenter_name TEXT;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.author_id THEN RETURN NEW; END IF;
  SELECT display_name INTO commenter_name FROM public.profiles WHERE user_id = NEW.author_id;
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (post_author, 'تعليق جديد 💬',
    COALESCE(commenter_name, 'مستخدم') || ' علّق على منشورك: ' || LEFT(NEW.content, 60), 'post_comment');
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_post_author_on_share()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_author UUID; sharer_name TEXT;
BEGIN
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
  IF post_author IS NULL OR post_author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT display_name INTO sharer_name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (post_author, 'مشاركة جديدة 🔁',
    COALESCE(sharer_name, 'مستخدم') || ' شارك منشورك', 'post_share');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_notify_post_reaction AFTER INSERT ON public.post_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_post_author_on_reaction();

DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.post_comments;
CREATE TRIGGER trg_notify_post_comment AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_post_author_on_comment();

DROP TRIGGER IF EXISTS trg_notify_post_share ON public.post_shares;
CREATE TRIGGER trg_notify_post_share AFTER INSERT ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.notify_post_author_on_share();