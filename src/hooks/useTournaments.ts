import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type TournamentType = Database['public']['Enums']['tournament_type'];
type TournamentStatus = Database['public']['Enums']['tournament_status'];

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({ title: 'خطأ', description: 'فشل في جلب البطولات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createTournament = async (tournament: {
    name: string;
    type: TournamentType;
    startDate: string;
    numTeams: number;
    numGroups?: number;
    logoUrl?: string | null;
    venueName?: string;
    venueAddress?: string;
    acceptJoinRequests?: boolean;
    maxTeams?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert({
          name: tournament.name,
          type: tournament.type,
          status: 'draft' as TournamentStatus,
          start_date: tournament.startDate || null,
          num_teams: tournament.numTeams,
          num_groups: tournament.numGroups || 4,
          owner_id: user?.id || null,
          logo_url: tournament.logoUrl || null,
          venue_name: tournament.venueName || null,
          venue_address: tournament.venueAddress || null,
          accept_join_requests: tournament.acceptJoinRequests || false,
          max_teams: tournament.maxTeams || null,
        })
        .select()
        .single();

      if (error) throw error;
      setTournaments((prev) => [data, ...prev]);
      toast({ title: 'تم بنجاح', description: 'تم إنشاء البطولة بنجاح' });
      return data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء البطولة', variant: 'destructive' });
      return null;
    }
  };

  const addTeams = async (tournamentId: string, teamNames: string[]) => {
    try {
      const teams = teamNames.map((name, index) => ({
        tournament_id: tournamentId,
        name,
        seed: index + 1,
      }));
      const { data, error } = await supabase.from('teams').insert(teams).select();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding teams:', error);
      toast({ title: 'خطأ', description: 'فشل في إضافة الفرق', variant: 'destructive' });
      return null;
    }
  };

  const performAIDraw = async (teams: string[], tournamentType: TournamentType, numGroups?: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-draw', {
        body: { teams, tournamentType, numGroups },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error performing AI draw:', error);
      // Fallback: shuffle locally
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      if (tournamentType === 'groups' && numGroups) {
        const groups: Record<string, string[]> = {};
        const perGroup = Math.ceil(shuffled.length / numGroups);
        for (let i = 0; i < numGroups; i++) {
          const letter = String.fromCharCode(65 + i);
          groups[letter] = shuffled.slice(i * perGroup, (i + 1) * perGroup);
        }
        return { groups };
      }
      return { draw: shuffled };
    }
  };

  const generateKnockoutMatches = async (tournamentId: string, teams: Team[]) => {
    try {
      const matches = [];
      const numMatches = teams.length / 2;
      for (let i = 0; i < numMatches; i++) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: teams[i * 2].id,
          away_team_id: teams[i * 2 + 1].id,
          round: 1,
          match_order: i + 1,
          status: 'scheduled' as const,
        });
      }
      const { data, error } = await supabase.from('matches').insert(matches).select();
      if (error) throw error;
      await supabase.from('tournaments').update({ status: 'upcoming' as TournamentStatus }).eq('id', tournamentId);
      return data;
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء المباريات', variant: 'destructive' });
      return null;
    }
  };

  const generateGroupMatches = async (tournamentId: string, teams: Team[], groups: Record<string, string[]>) => {
    try {
      const allStandings: any[] = [];

      // For each group, assign group_name to teams
      for (const [groupName, groupTeamNames] of Object.entries(groups)) {
        const groupTeams = groupTeamNames
          .map(name => teams.find(t => t.name === name))
          .filter(Boolean) as Team[];

        for (const team of groupTeams) {
          await supabase.from('teams').update({ group_name: groupName }).eq('id', team.id);
        }

        // Create standings for group
        groupTeams.forEach((team, index) => {
          allStandings.push({
            tournament_id: tournamentId,
            team_id: team.id,
            group_name: groupName,
            position: index + 1,
          });
        });
      }

      // No round-robin matches in mixed mode - groups are just for seeding
      // Matches will be knockout after groups phase
      if (allStandings.length > 0) {
        const { error: standingsError } = await supabase.from('standings').insert(allStandings);
        if (standingsError) throw standingsError;
      }

      await supabase.from('tournaments').update({ status: 'upcoming' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: 'تم إنشاء المجموعات ✅', description: 'يمكنك الآن بدء مرحلة الإقصاء' });
      return true;
    } catch (error) {
      console.error('Error generating group matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء المجموعات', variant: 'destructive' });
      return null;
    }
  };

  const startKnockoutFromGroups = async (tournamentId: string) => {
    try {
      // Get standings grouped by group_name, sorted by position
      const { data: standings } = await supabase
        .from('standings')
        .select('*, team:team_id(*)')
        .eq('tournament_id', tournamentId)
        .order('group_name')
        .order('points', { ascending: false });

      if (!standings || standings.length === 0) return null;

      // Get top 2 from each group (or top 1 if small groups)
      const grouped = standings.reduce((acc, s) => {
        const key = s.group_name || 'A';
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
      }, {} as Record<string, typeof standings>);

      const qualifiedTeamIds: string[] = [];
      const sortedGroups = Object.keys(grouped).sort();
      
      for (const groupName of sortedGroups) {
        const groupStandings = grouped[groupName];
        // Top 2 qualify
        const topTeams = groupStandings.slice(0, 2);
        topTeams.forEach(s => qualifiedTeamIds.push(s.team_id));
      }

      if (qualifiedTeamIds.length < 2) return null;

      // Create knockout matches
      const matches = [];
      for (let i = 0; i < qualifiedTeamIds.length; i += 2) {
        if (qualifiedTeamIds[i + 1]) {
          matches.push({
            tournament_id: tournamentId,
            home_team_id: qualifiedTeamIds[i],
            away_team_id: qualifiedTeamIds[i + 1],
            round: 1,
            match_order: Math.floor(i / 2) + 1,
            status: 'scheduled' as const,
          });
        }
      }

      if (matches.length > 0) {
        const { error } = await supabase.from('matches').insert(matches);
        if (error) throw error;
      }

      await supabase.from('tournaments').update({ status: 'live' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: 'تم بدء مرحلة الإقصاء 🏆' });
      return true;
    } catch (error) {
      console.error('Error starting knockout from groups:', error);
      toast({ title: 'خطأ', variant: 'destructive' });
      return null;
    }
  };

  const updateStandings = async (tournamentId: string, homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number) => {
    const { data: homeSt } = await supabase.from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', homeTeamId).single();
    const { data: awaySt } = await supabase.from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', awayTeamId).single();

    if (homeSt) {
      const won = homeScore > awayScore ? 1 : 0;
      const drawn = homeScore === awayScore ? 1 : 0;
      const lost = homeScore < awayScore ? 1 : 0;
      await supabase.from('standings').update({
        played: (homeSt.played || 0) + 1,
        won: (homeSt.won || 0) + won,
        drawn: (homeSt.drawn || 0) + drawn,
        lost: (homeSt.lost || 0) + lost,
        goals_for: (homeSt.goals_for || 0) + homeScore,
        goals_against: (homeSt.goals_against || 0) + awayScore,
        goal_difference: (homeSt.goals_for || 0) + homeScore - ((homeSt.goals_against || 0) + awayScore),
        points: (homeSt.points || 0) + (won ? 3 : drawn ? 1 : 0),
      }).eq('id', homeSt.id);
    }

    if (awaySt) {
      const won = awayScore > homeScore ? 1 : 0;
      const drawn = homeScore === awayScore ? 1 : 0;
      const lost = awayScore < homeScore ? 1 : 0;
      await supabase.from('standings').update({
        played: (awaySt.played || 0) + 1,
        won: (awaySt.won || 0) + won,
        drawn: (awaySt.drawn || 0) + drawn,
        lost: (awaySt.lost || 0) + lost,
        goals_for: (awaySt.goals_for || 0) + awayScore,
        goals_against: (awaySt.goals_against || 0) + homeScore,
        goal_difference: (awaySt.goals_for || 0) + awayScore - ((awaySt.goals_against || 0) + homeScore),
        points: (awaySt.points || 0) + (won ? 3 : drawn ? 1 : 0),
      }).eq('id', awaySt.id);
    }
  };

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      const winnerId = homeScore > awayScore ? match.home_team_id : homeScore < awayScore ? match.away_team_id : null;
      const loserId = homeScore > awayScore ? match.away_team_id : homeScore < awayScore ? match.home_team_id : null;

      const { error: updateError } = await supabase.from('matches').update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed',
        winner_id: winnerId,
      }).eq('id', matchId);

      if (updateError) throw updateError;

      const { data: tournamentData } = await supabase.from('tournaments').select('type').eq('id', match.tournament_id).single();
      const tType = tournamentData?.type;

      if (tType === 'knockout' || (tType === 'groups' && !match.group_name)) {
        // Knockout match
        if (loserId) {
          await supabase.from('teams').update({ is_eliminated: true }).eq('id', loserId);
        }
        await advanceWinner(match.tournament_id, match.round, winnerId);
      }

      toast({ title: 'تم بنجاح', description: 'تم تحديث النتيجة' });
      return true;
    } catch (error) {
      console.error('Error updating match:', error);
      toast({ title: 'خطأ', description: 'فشل في تحديث النتيجة', variant: 'destructive' });
      return false;
    }
  };

  const advanceWinner = async (tournamentId: string, currentRound: number, winnerId: string | null) => {
    if (!winnerId) return;

    const { data: currentRoundMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', currentRound);

    if (!currentRoundMatches) return;
    const allCompleted = currentRoundMatches.every((m) => m.status === 'completed');
    if (!allCompleted) return;

    const winners = currentRoundMatches.filter((m) => m.winner_id).map((m) => m.winner_id);

    if (winners.length <= 1) {
      await supabase.from('tournaments').update({ status: 'completed' as TournamentStatus }).eq('id', tournamentId);
      return;
    }

    const { data: existingNextRound } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', currentRound + 1);

    if (existingNextRound && existingNextRound.length > 0) return;

    const nextRoundMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i + 1]) {
        nextRoundMatches.push({
          tournament_id: tournamentId,
          home_team_id: winners[i],
          away_team_id: winners[i + 1],
          round: currentRound + 1,
          match_order: Math.floor(i / 2) + 1,
          status: 'scheduled' as const,
        });
      }
    }

    if (nextRoundMatches.length > 0) {
      await supabase.from('matches').insert(nextRoundMatches);
      await supabase.from('tournaments').update({ current_round: currentRound + 1 }).eq('id', tournamentId);
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      const { error } = await supabase.from('tournaments').delete().eq('id', id);
      if (error) throw error;
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'تم بنجاح', description: 'تم حذف البطولة' });
      return true;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({ title: 'خطأ', description: 'فشل في حذف البطولة', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return {
    tournaments,
    loading,
    fetchTournaments,
    createTournament,
    addTeams,
    performAIDraw,
    generateKnockoutMatches,
    generateGroupMatches,
    startKnockoutFromGroups,
    updateMatchResult,
    deleteTournament,
  };
}
