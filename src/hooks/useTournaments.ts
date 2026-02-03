import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

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

      // Update tournament status
      await supabase
        .from('tournaments')
        .update({ status: 'upcoming' as TournamentStatus })
        .eq('id', tournamentId);

      return data;
    } catch (error) {
      console.error('Error generating matches:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء المباريات',
        variant: 'destructive',
      });
      return null;
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

      // Mark loser as eliminated
      if (loserId) {
        await supabase
          .from('teams')
          .update({ is_eliminated: true })
          .eq('id', loserId);
      }

      // Check if we need to create next round matches
      await advanceWinner(match.tournament_id, match.round, winnerId);

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
    updateMatchResult,
    deleteTournament,
  };
}
