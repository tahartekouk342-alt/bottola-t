
-- Create a database function to notify followers when tournament is created/updated
CREATE OR REPLACE FUNCTION public.notify_followers_on_tournament_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  follower RECORD;
  notif_title TEXT;
  notif_message TEXT;
  organizer_name TEXT;
BEGIN
  -- Get organizer name
  SELECT display_name INTO organizer_name
  FROM public.profiles
  WHERE user_id = NEW.owner_id;

  IF TG_OP = 'INSERT' THEN
    notif_title := 'بطولة جديدة 🏆';
    notif_message := organizer_name || ' أنشأ بطولة جديدة: ' || NEW.name;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'live' THEN
        notif_title := 'بطولة جارية 🔴';
        notif_message := 'بطولة ' || NEW.name || ' بدأت الآن!';
      ELSIF NEW.status = 'completed' THEN
        notif_title := 'بطولة منتهية ✅';
        notif_message := 'انتهت بطولة ' || NEW.name;
      ELSE
        RETURN NEW;
      END IF;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Send notification to all followers
  FOR follower IN
    SELECT follower_id FROM public.user_follows WHERE following_id = NEW.owner_id
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_tournament_id, related_organizer_id)
    VALUES (follower.follower_id, notif_title, notif_message, 'tournament', NEW.id, NEW.owner_id);
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Create trigger on tournaments table
CREATE TRIGGER notify_followers_tournament_change
AFTER INSERT OR UPDATE ON public.tournaments
FOR EACH ROW
WHEN (NEW.owner_id IS NOT NULL)
EXECUTE FUNCTION public.notify_followers_on_tournament_change();

-- Create a function to notify followers on match result updates
CREATE OR REPLACE FUNCTION public.notify_followers_on_match_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  follower RECORD;
  tournament_record RECORD;
  home_name TEXT;
  away_name TEXT;
BEGIN
  -- Only notify when match is completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Get tournament info
    SELECT t.name, t.owner_id INTO tournament_record
    FROM public.tournaments t
    WHERE t.id = NEW.tournament_id;

    IF tournament_record.owner_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get team names
    SELECT name INTO home_name FROM public.teams WHERE id = NEW.home_team_id;
    SELECT name INTO away_name FROM public.teams WHERE id = NEW.away_team_id;

    -- Notify followers
    FOR follower IN
      SELECT follower_id FROM public.user_follows WHERE following_id = tournament_record.owner_id
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, related_tournament_id, related_organizer_id)
      VALUES (
        follower.follower_id,
        'نتيجة مباراة ⚽',
        COALESCE(home_name, '?') || ' ' || COALESCE(NEW.home_score::text, '0') || ' - ' || COALESCE(NEW.away_score::text, '0') || ' ' || COALESCE(away_name, '?') || ' | ' || tournament_record.name,
        'match_result',
        NEW.tournament_id,
        tournament_record.owner_id
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on matches table
CREATE TRIGGER notify_followers_match_complete
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_match_complete();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
