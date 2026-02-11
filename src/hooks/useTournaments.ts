import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];
type Standing = Database['public']['Tables']['standings']['Row'];

type TournamentType = Database['public']['Enums']['tournament_type'];
type TournamentStatus = Database['public']['Enums']['tournament_status'];

export interface TournamentWithTeams extends Tournament {
  teams: Team[];
  matches: Match[];
}

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
      toast({
        title: 'خطأ',
        description: 'فشل في جلب البطولات',
        variant: 'destructive',
      });
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
        })
        .select()
        .single();

      if (error) throw error;

      setTournaments((prev) => [data, ...prev]);
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء البطولة بنجاح',
      });
      return data;
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء البطولة',
        variant: 'destructive',
      });
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

      const { data, error } = await supabase
        .from('teams')
        .insert(teams)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding teams:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إضافة الفرق',
        variant: 'destructive',
      });
      return null;
    }
  };

  const performAIDraw = async (
    teams: string[],
    tournamentType: TournamentType,
    numGroups?: number
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-draw', {
        body: { teams, tournamentType, numGroups },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error performing AI draw:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إجراء القرعة',
        variant: 'destructive',
      });
      return null;
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

      const { data, error } = await supabase
        .from('matches')
        .insert(matches)
        .select();

      if (error) throw error;

      await supabase
        .from('tournaments')
        .update({ status: 'upcoming' as TournamentStatus })
        .eq('id', tournamentId);

      return data;
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء المباريات', variant: 'destructive' });
      return null;
    }
  };

  const generateLeagueMatches = async (tournamentId: string, teams: Team[]) => {
    try {
      const matches: any[] = [];
      let matchOrder = 1;
      const totalRounds = teams.length - 1 + (teams.length % 2 === 0 ? 0 : 0);

      // Round-robin: each team plays every other team once
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const round = Math.min(i + 1, totalRounds || 1);
          matches.push({
            tournament_id: tournamentId,
            home_team_id: teams[i].id,
            away_team_id: teams[j].id,
            round,
            match_order: matchOrder++,
            status: 'scheduled' as const,
          });
        }
      }

      const { error: matchError } = await supabase.from('matches').insert(matches);
      if (matchError) throw matchError;

      // Create standings for each team
      const standingsData = teams.map((team, index) => ({
        tournament_id: tournamentId,
        team_id: team.id,
        position: index + 1,
      }));

      const { error: standingsError } = await supabase.from('standings').insert(standingsData);
      if (standingsError) throw standingsError;

      await supabase
        .from('tournaments')
        .update({ status: 'upcoming' as TournamentStatus })
        .eq('id', tournamentId);

      toast({ title: 'تم إنشاء جدول الدوري ✅' });
      return true;
    } catch (error) {
      console.error('Error generating league matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء مباريات الدوري', variant: 'destructive' });
      return null;
    }
  };

  const generateGroupMatches = async (
    tournamentId: string,
    teams: Team[],
    groups: Record<string, string[]>
  ) => {
    try {
      const allMatches: any[] = [];
      const allStandings: any[] = [];
      let matchOrder = 1;

      // For each group, assign group_name to teams and generate round-robin
      for (const [groupName, groupTeamNames] of Object.entries(groups)) {
        const groupTeams = groupTeamNames
          .map(name => teams.find(t => t.name === name))
          .filter(Boolean) as Team[];

        // Update team group_name
        for (const team of groupTeams) {
          await supabase.from('teams').update({ group_name: groupName }).eq('id', team.id);
        }

        // Round-robin within group
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            allMatches.push({
              tournament_id: tournamentId,
              home_team_id: groupTeams[i].id,
              away_team_id: groupTeams[j].id,
              round: 1,
              match_order: matchOrder++,
              status: 'scheduled' as const,
              group_name: groupName,
            });
          }
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

      const { error: matchError } = await supabase.from('matches').insert(allMatches);
      if (matchError) throw matchError;

      const { error: standingsError } = await supabase.from('standings').insert(allStandings);
      if (standingsError) throw standingsError;

      await supabase
        .from('tournaments')
        .update({ status: 'upcoming' as TournamentStatus })
        .eq('id', tournamentId);

      toast({ title: 'تم إنشاء مباريات المجموعات ✅' });
      return true;
    } catch (error) {
      console.error('Error generating group matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء مباريات المجموعات', variant: 'destructive' });
      return null;
    }
  };
  const updateStandings = async (
    tournamentId: string,
    homeTeamId: string,
    awayTeamId: string,
    homeScore: number,
    awayScore: number
  ) => {
    // Update home team standings
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

  const updateMatchResult = async (
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    try {
      // Get match details first
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      const winnerId = homeScore > awayScore 
        ? match.home_team_id 
        : homeScore < awayScore 
          ? match.away_team_id 
          : null;

      const loserId = homeScore > awayScore 
        ? match.away_team_id 
        : homeScore < awayScore 
          ? match.home_team_id 
          : null;

      // Update match
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'completed',
          winner_id: winnerId,
        })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Get tournament type to decide behavior
      const { data: tournamentData } = await supabase.from('tournaments').select('type').eq('id', match.tournament_id).single();
      const tType = tournamentData?.type;

      if (tType === 'knockout') {
        // Mark loser as eliminated
        if (loserId) {
          await supabase.from('teams').update({ is_eliminated: true }).eq('id', loserId);
        }
        // Check if we need to create next round matches
        await advanceWinner(match.tournament_id, match.round, winnerId);
      } else {
        // League or Groups: update standings
        await updateStandings(match.tournament_id, match.home_team_id!, match.away_team_id!, homeScore, awayScore);
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث النتيجة',
      });

      return true;
    } catch (error) {
      console.error('Error updating match:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث النتيجة',
        variant: 'destructive',
      });
      return false;
    }
  };

  const advanceWinner = async (
    tournamentId: string,
    currentRound: number,
    winnerId: string | null
  ) => {
    if (!winnerId) return;

    // Get all matches in current round
    const { data: currentRoundMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', currentRound);

    if (!currentRoundMatches) return;

    // Check if all matches in current round are completed
    const allCompleted = currentRoundMatches.every(
      (m) => m.status === 'completed'
    );

    if (!allCompleted) return;

    // Get winners
    const winners = currentRoundMatches
      .filter((m) => m.winner_id)
      .map((m) => m.winner_id);

    if (winners.length <= 1) {
      // Tournament finished
      await supabase
        .from('tournaments')
        .update({ status: 'completed' as TournamentStatus })
        .eq('id', tournamentId);
      return;
    }

    // Check if next round already exists
    const { data: existingNextRound } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', currentRound + 1);

    if (existingNextRound && existingNextRound.length > 0) return;

    // Create next round matches
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
      
      // Update current round in tournament
      await supabase
        .from('tournaments')
        .update({ current_round: currentRound + 1 })
        .eq('id', tournamentId);
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTournaments((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'تم بنجاح',
        description: 'تم حذف البطولة',
      });
      return true;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف البطولة',
        variant: 'destructive',
      });
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
    generateLeagueMatches,
    generateGroupMatches,
    updateMatchResult,
    deleteTournament,
  };
}
