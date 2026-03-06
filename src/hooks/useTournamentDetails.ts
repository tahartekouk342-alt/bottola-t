import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Standing = Database['public']['Tables']['standings']['Row'];

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
  winner: Team | null;
}

export function useTournamentDetails(tournamentId: string | undefined) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTournamentDetails = useCallback(async () => {
    if (!tournamentId) return;

    try {
      // Fetch tournament
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .maybeSingle();

      if (tournamentError) throw tournamentError;
      setTournament(tournamentData);

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed', { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch matches with team details - use safer nested select
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: true })
        .order('match_order', { ascending: true });

      if (matchesError) throw matchesError;

      // Fetch team data separately and enrich matches
      if (matchesData && matchesData.length > 0) {
        const homeTeamIds = [...new Set(matchesData.map(m => m.home_team_id))];
        const awayTeamIds = [...new Set(matchesData.map(m => m.away_team_id))];
        const winnerTeamIds = [...new Set(matchesData.map(m => m.winner_id).filter(Boolean))];
        const allTeamIds = [...new Set([...homeTeamIds, ...awayTeamIds, ...winnerTeamIds])];

        const { data: allTeams } = await supabase
          .from('teams')
          .select('*')
          .in('id', allTeamIds);

        const teamsMap = new Map((allTeams || []).map(t => [t.id, t]));

        const enrichedMatches: MatchWithTeams[] = matchesData.map(match => ({
          ...match,
          home_team: teamsMap.get(match.home_team_id) || null,
          away_team: teamsMap.get(match.away_team_id) || null,
          winner: match.winner_id ? teamsMap.get(match.winner_id) || null : null,
        }));

        setMatches(enrichedMatches);
      } else {
        setMatches([]);
      }

      // Fetch standings - order by group, then by points and goal difference
      const { data: standingsData, error: standingsError } = await supabase
        .from('standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('group_name', { ascending: true })
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false });

      if (standingsError) throw standingsError;
      setStandings(standingsData || []);
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب تفاصيل البطولة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tournamentId, toast]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tournamentId) return;

    fetchTournamentDetails();

    const matchesChannel = supabase
      .channel(`matches-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchTournamentDetails();
        }
      )
      .subscribe();

    const standingsChannel = supabase
      .channel(`standings-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'standings',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchTournamentDetails();
        }
      )
      .subscribe();

    return () => {
      matchesChannel.unsubscribe();
      standingsChannel.unsubscribe();
    };
  }, [tournamentId, fetchTournamentDetails]);

  const getMatchesByRound = () => {
    const roundsMap = new Map<number, MatchWithTeams[]>();
    
    matches.forEach((match) => {
      const round = match.round;
      if (!roundsMap.has(round)) {
        roundsMap.set(round, []);
      }
      roundsMap.get(round)?.push(match);
    });

    return Array.from(roundsMap.entries()).sort((a, b) => a[0] - b[0]);
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - round;
    switch (roundsFromEnd) {
      case 0:
        return 'النهائي';
      case 1:
        return 'نصف النهائي';
      case 2:
        return 'ربع النهائي';
      case 3:
        return 'دور الـ16';
      case 4:
        return 'دور الـ32';
      default:
        return `الجولة ${round}`;
    }
  };

  return {
    tournament,
    teams,
    matches,
    standings,
    loading,
    fetchTournamentDetails,
    getMatchesByRound,
    getRoundName,
  };
}
