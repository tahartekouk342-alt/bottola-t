CREATE OR REPLACE FUNCTION public.create_league_tournament_full(
  p_name text,
  p_start_date timestamptz,
  p_team_names text[],
  p_owner_id uuid DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_venue_name text DEFAULT NULL,
  p_venue_address text DEFAULT NULL,
  p_referee_name text DEFAULT NULL,
  p_venue_photos text[] DEFAULT ARRAY[]::text[],
  p_sport_type public.sport_type DEFAULT 'football'::public.sport_type,
  p_age_category text DEFAULT NULL,
  p_volleyball_format text DEFAULT NULL,
  p_season text DEFAULT NULL,
  p_league_legs smallint DEFAULT 1,
  p_has_playoff boolean DEFAULT false,
  p_playoff_teams smallint DEFAULT 4
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament_id uuid;
  v_clean_names text[];
  v_team_count int;
  v_team_ids uuid[] := ARRAY[]::uuid[];
  v_team_id uuid;
  v_name text;
  v_idx int := 1;
  v_schedule uuid[];
  v_n int;
  v_rounds_per_leg int;
  v_leg int;
  v_round int;
  v_pair int;
  v_a uuid;
  v_b uuid;
  v_home uuid;
  v_away uuid;
  v_match_order int := 1;
  v_fixed uuid;
  v_rest uuid[];
  v_last uuid;
BEGIN
  SELECT array_agg(trim(x))
  INTO v_clean_names
  FROM unnest(p_team_names) AS x
  WHERE trim(x) <> '';

  v_team_count := COALESCE(array_length(v_clean_names, 1), 0);

  IF v_team_count < 2 THEN
    RAISE EXCEPTION 'يجب إدخال فريقين على الأقل';
  END IF;

  IF p_league_legs NOT IN (1, 2) THEN
    RAISE EXCEPTION 'نظام الدوري يجب أن يكون ذهاب فقط أو ذهاب وإياب';
  END IF;

  INSERT INTO public.tournaments (
    name, type, status, start_date, num_teams, owner_id, logo_url,
    venue_name, venue_address, referee_name, accept_join_requests, max_teams,
    venue_photos, sport_type, age_category, volleyball_format, season,
    league_legs, has_playoff, playoff_teams
  ) VALUES (
    p_name, 'league'::public.tournament_type, 'draft'::public.tournament_status, p_start_date, v_team_count, p_owner_id, p_logo_url,
    p_venue_name, p_venue_address, p_referee_name, false, NULL,
    COALESCE(p_venue_photos, ARRAY[]::text[]), p_sport_type, p_age_category, p_volleyball_format, p_season,
    p_league_legs, p_has_playoff, p_playoff_teams
  ) RETURNING id INTO v_tournament_id;

  FOREACH v_name IN ARRAY v_clean_names LOOP
    INSERT INTO public.teams (tournament_id, name, seed)
    VALUES (v_tournament_id, v_name, v_idx)
    RETURNING id INTO v_team_id;

    v_team_ids := array_append(v_team_ids, v_team_id);

    INSERT INTO public.standings (
      tournament_id, team_id, position, played, won, drawn, lost,
      goals_for, goals_against, goal_difference, points
    ) VALUES (
      v_tournament_id, v_team_id, v_idx, 0, 0, 0, 0, 0, 0, 0, 0
    );

    v_idx := v_idx + 1;
  END LOOP;

  v_schedule := v_team_ids;
  IF v_team_count % 2 = 1 THEN
    v_schedule := array_append(v_schedule, NULL::uuid);
  END IF;

  v_n := array_length(v_schedule, 1);
  v_rounds_per_leg := v_n - 1;

  FOR v_leg IN 1..p_league_legs LOOP
    v_schedule := v_team_ids;
    IF v_team_count % 2 = 1 THEN
      v_schedule := array_append(v_schedule, NULL::uuid);
    END IF;

    FOR v_round IN 1..v_rounds_per_leg LOOP
      FOR v_pair IN 1..(v_n / 2) LOOP
        v_a := v_schedule[v_pair];
        v_b := v_schedule[v_n - v_pair + 1];

        IF v_a IS NOT NULL AND v_b IS NOT NULL THEN
          IF v_leg = 2 THEN
            v_home := v_b;
            v_away := v_a;
          ELSE
            v_home := v_a;
            v_away := v_b;
          END IF;

          INSERT INTO public.matches (
            tournament_id, home_team_id, away_team_id, round,
            match_order, status, leg
          ) VALUES (
            v_tournament_id, v_home, v_away,
            ((v_leg - 1) * v_rounds_per_leg) + v_round,
            v_match_order, 'scheduled'::public.match_status, v_leg
          );
          v_match_order := v_match_order + 1;
        END IF;
      END LOOP;

      v_fixed := v_schedule[1];
      v_rest := v_schedule[2:v_n];
      v_last := v_rest[array_length(v_rest, 1)];
      v_rest := array_prepend(v_last, v_rest[1:array_length(v_rest, 1) - 1]);
      v_schedule := array_prepend(v_fixed, v_rest);
    END LOOP;
  END LOOP;

  UPDATE public.tournaments
  SET status = 'active'::public.tournament_status,
      updated_at = now()
  WHERE id = v_tournament_id;

  RETURN v_tournament_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_league_tournament_full(
  text, timestamptz, text[], uuid, text, text, text, text, text[], public.sport_type, text, text, text, smallint, boolean, smallint
) TO anon, authenticated;