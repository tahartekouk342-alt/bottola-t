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
    teamsPerGroup?: number;
    logoUrl?: string | null;
    venueName?: string;
    venueAddress?: string;
    acceptJoinRequests?: boolean;
    maxTeams?: number;
    venuePhotos?: string[];
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
          teams_per_group: tournament.teamsPerGroup || 4,
          owner_id: user?.id || null,
          logo_url: tournament.logoUrl || null,
          venue_name: tournament.venueName || null,
          venue_address: tournament.venueAddress || null,
          accept_join_requests: tournament.acceptJoinRequests || false,
          max_teams: tournament.maxTeams || null,
          venue_photos: tournament.venuePhotos || [],
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

  const deleteTournament = async (tournamentId: string) => {
    try {
      await supabase.from('standings').delete().eq('tournament_id', tournamentId);
      await supabase.from('matches').delete().eq('tournament_id', tournamentId);
      await supabase.from('teams').delete().eq('tournament_id', tournamentId);
      await supabase.from('join_requests').delete().eq('tournament_id', tournamentId);

      const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId);
      if (error) throw error;

      setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
      toast({ title: 'تم حذف البطولة ✅' });
      return true;
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast({ title: 'خطأ', description: 'فشل في حذف البطولة', variant: 'destructive' });
      return false;
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
      if (!teams || teams.length < 2) {
        throw new Error('يجب أن يكون هناك فريقين على الأقل');
      }

      const matches = [];
      const numMatches = Math.floor(teams.length / 2);
      
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
      toast({ title: 'تم بنجاح', description: 'تم إنشاء مباريات الإقصاء المباشر' });
      return data;
    } catch (error) {
      console.error('Error generating knockout matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء المباريات', variant: 'destructive' });
      return null;
    }
  };

  const generateGroupMatches = async (tournamentId: string, teams: Team[], groups: Record<string, string[]>) => {
    try {
      const allStandings: any[] = [];
      const allMatches: any[] = [];
      let matchOrder = 1;

      for (const [groupName, groupTeamNames] of Object.entries(groups)) {
        const groupTeams = groupTeamNames
          .map(name => teams.find(t => t.name === name))
          .filter(Boolean) as Team[];

        for (const team of groupTeams) {
          await supabase.from('teams').update({ group_name: groupName }).eq('id', team.id);
        }

        groupTeams.forEach((team, index) => {
          allStandings.push({
            tournament_id: tournamentId,
            team_id: team.id,
            group_name: groupName,
            position: index + 1,
            played: 0, won: 0, drawn: 0, lost: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
          });
        });

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
      }

      if (allStandings.length > 0) {
        const { error: standingsError } = await supabase.from('standings').insert(allStandings);
        if (standingsError) throw standingsError;
      }

      if (allMatches.length > 0) {
        const { error: matchesError } = await supabase.from('matches').insert(allMatches);
        if (matchesError) throw matchesError;
      }

      await supabase.from('tournaments').update({ status: 'upcoming' as TournamentStatus }).eq('id', tournamentId);
      toast({ title: 'تم إنشاء المجموعات ✅', description: `تم إنشاء ${allMatches.length} مباراة في مرحلة المجموعات` });
      return true;
    } catch (error) {
      console.error('Error generating group matches:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء المجموعات', variant: 'destructive' });
      return null;
    }
  };

  const startKnockoutFromGroups = async (tournamentId: string, showToast = true) => {
    try {
      // First check if all group matches are completed
      const { data: groupMatches } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .not('group_name', 'is', null);

      if (groupMatches && groupMatches.length > 0) {
        const incompleteGroupMatches = groupMatches.filter(m => m.status !== 'completed');
        if (incompleteGroupMatches.length > 0) {
          if (showToast) toast({ title: 'تنبيه ⚠️', description: `لم تكتمل ${incompleteGroupMatches.length} مباراة في المجموعات بعد`, variant: 'destructive' });
          return null;
        }
      }

      const { data: standings } = await supabase
        .from('standings')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('group_name')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false });

      if (!standings || standings.length === 0) {
        throw new Error('لا توجد جداول ترتيب');
      }

      // Group standings by group_name
      const grouped: Record<string, typeof standings> = {};
      for (const s of standings) {
        const key = s.group_name || 'A';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
      }

      // Sort each group by points then goal_difference
      for (const key of Object.keys(grouped)) {
        grouped[key].sort((a, b) => {
          const pointsDiff = (b.points || 0) - (a.points || 0);
          if (pointsDiff !== 0) return pointsDiff;
          return (b.goal_difference || 0) - (a.goal_difference || 0);
        });
      }

      const sortedGroups = Object.keys(grouped).sort();
      
      // Get top 2 from each group
      const firsts: string[] = [];
      const seconds: string[] = [];
      for (const groupName of sortedGroups) {
        const grp = grouped[groupName];
        if (grp[0]) firsts.push(grp[0].team_id);
        if (grp[1]) seconds.push(grp[1].team_id);
      }

      if (firsts.length === 0 || seconds.length === 0) {
        throw new Error('عدد الفرق المتأهلة غير كافي');
      }

      // Determine the next round number (after group matches)
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('round')
        .eq('tournament_id', tournamentId)
        .order('round', { ascending: false })
        .limit(1);

      const nextRound = existingMatches && existingMatches.length > 0 
        ? (existingMatches[0].round || 1) + 1 
        : 2;

      // Cross-group pairing: 1st of group A vs 2nd of last group, etc.
      const matches = [];
      const reversedSeconds = [...seconds].reverse();

      for (let i = 0; i < Math.min(firsts.length, reversedSeconds.length); i++) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: firsts[i],
          away_team_id: reversedSeconds[i],
          round: nextRound,
          match_order: i + 1,
          status: 'scheduled' as const,
        });
      }

      if (matches.length > 0) {
        const { error } = await supabase.from('matches').insert(matches);
        if (error) throw error;
      }

      await supabase.from('tournaments').update({ status: 'live' as TournamentStatus }).eq('id', tournamentId);
      if (showToast) toast({ title: 'تم بدء مرحلة الإقصاء 🏆', description: `${matches.length} مباراة في مرحلة الإقصاء` });
      return true;
    } catch (error: any) {
      console.error('Error starting knockout from groups:', error);
      if (showToast) toast({ title: 'خطأ', description: error.message || 'فشل في بدء مرحلة الإقصاء', variant: 'destructive' });
      return null;
    }
  };

  const updateStandings = async (tournamentId: string, homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number) => {
    try {
      const { data: homeSt } = await supabase
        .from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', homeTeamId).single();
      const { data: awaySt } = await supabase
        .from('standings').select('*').eq('tournament_id', tournamentId).eq('team_id', awayTeamId).single();

      if (homeSt) {
        const won = homeScore > awayScore ? 1 : 0;
        const drawn = homeScore === awayScore ? 1 : 0;
        const lost = homeScore < awayScore ? 1 : 0;
        const points = (homeSt.points || 0) + (won ? 3 : drawn ? 1 : 0);
        await supabase.from('standings').update({
          played: (homeSt.played || 0) + 1, won: (homeSt.won || 0) + won,
          drawn: (homeSt.drawn || 0) + drawn, lost: (homeSt.lost || 0) + lost,
          goals_for: (homeSt.goals_for || 0) + homeScore, goals_against: (homeSt.goals_against || 0) + awayScore,
          goal_difference: ((homeSt.goals_for || 0) + homeScore) - ((homeSt.goals_against || 0) + awayScore), points,
        }).eq('id', homeSt.id);
      }

      if (awaySt) {
        const won = awayScore > homeScore ? 1 : 0;
        const drawn = homeScore === awayScore ? 1 : 0;
        const lost = awayScore < homeScore ? 1 : 0;
        const points = (awaySt.points || 0) + (won ? 3 : drawn ? 1 : 0);
        await supabase.from('standings').update({
          played: (awaySt.played || 0) + 1, won: (awaySt.won || 0) + won,
          drawn: (awaySt.drawn || 0) + drawn, lost: (awaySt.lost || 0) + lost,
          goals_for: (awaySt.goals_for || 0) + awayScore, goals_against: (awaySt.goals_against || 0) + homeScore,
          goal_difference: ((awaySt.goals_for || 0) + awayScore) - ((awaySt.goals_against || 0) + homeScore), points,
        }).eq('id', awaySt.id);
      }
    } catch (error) {
      console.error('Error updating standings:', error);
    }
  };

  const updateMatchResult = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const { data: match, error: fetchError } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (fetchError) throw fetchError;

      const winnerId = homeScore > awayScore ? match.home_team_id : homeScore < awayScore ? match.away_team_id : null;

      const { error: updateError } = await supabase
        .from('matches')
        .update({ home_score: homeScore, away_score: awayScore, status: 'completed' as const, winner_id: winnerId })
        .eq('id', matchId);

      if (updateError) throw updateError;

      if (match.group_name) {
        await updateStandings(match.tournament_id, match.home_team_id, match.away_team_id, homeScore, awayScore);
      }

      toast({ title: 'تم تحديث النتيجة', description: `${homeScore} - ${awayScore}` });

      // Auto-progress logic for knockout/mixed systems
      const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', match.tournament_id).single();
      
      // For group tournaments, auto-trigger knockout when all group matches are done
      if (tournament && tournament.type === 'groups') {
        const { data: allGroupMatches } = await supabase
          .from('matches')
          .select('*')
          .eq('tournament_id', match.tournament_id)
          .not('group_name', 'is', null);

        if (allGroupMatches && allGroupMatches.every(m => m.status === 'completed')) {
          const { data: knockoutMatches } = await supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', match.tournament_id)
            .is('group_name', null);
          
          if (!knockoutMatches || knockoutMatches.length === 0) {
            await startKnockoutFromGroups(match.tournament_id, false);
          }
        }
      }

      // For knockout tournaments, auto-generate next round when current round is complete
      if (tournament && (tournament.type === 'knockout' || tournament.type === 'groups')) {
        if (!match.group_name) {
          const { data: allKnockoutMatches } = await supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', match.tournament_id)
            .is('group_name', null)
            .order('round', { ascending: false });

          if (allKnockoutMatches && allKnockoutMatches.length > 0) {
            const currentRound = allKnockoutMatches[0].round || 1;
            const currentRoundMatches = allKnockoutMatches.filter(m => m.round === currentRound);
            const completedMatches = currentRoundMatches.filter(m => m.status === 'completed');

            if (completedMatches.length === currentRoundMatches.length && currentRoundMatches.length > 1) {
              await generateNextRound(match.tournament_id, false);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating match result:', error);
      toast({ title: 'خطأ', description: 'فشل في تحديث النتيجة', variant: 'destructive' });
      return null;
    }
  };

  const generateNextRound = async (tournamentId: string, showToast = true) => {
    try {
      const { data: allMatches } = await supabase
        .from('matches').select('*').eq('tournament_id', tournamentId)
        .is('group_name', null).order('round', { ascending: false });

      if (!allMatches || allMatches.length === 0) {
        throw new Error('لا توجد مباريات');
      }

      const currentRound = allMatches[0].round || 1;

      const currentRoundMatches = allMatches.filter(m => m.round === currentRound);
      const completedRoundMatches = currentRoundMatches.filter(m => m.status === 'completed');

      if (completedRoundMatches.length < currentRoundMatches.length) {
        throw new Error('لم تكتمل جميع مباريات الجولة الحالية');
      }

      const winners = completedRoundMatches.map(m => m.winner_id).filter(Boolean) as string[];

      if (winners.length < 2) {
        if (showToast) toast({ title: '🏆 البطولة انتهت!', description: 'تم تحديد البطل' });
        await supabase.from('tournaments').update({ status: 'completed' as TournamentStatus }).eq('id', tournamentId);
        return true;
      }

      const nextRound = currentRound + 1;
      const nextMatches = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (winners[i + 1]) {
          nextMatches.push({
            tournament_id: tournamentId,
            home_team_id: winners[i],
            away_team_id: winners[i + 1],
            round: nextRound,
            match_order: Math.floor(i / 2) + 1,
            status: 'scheduled' as const,
          });
        }
      }

      if (nextMatches.length > 0) {
        const { error } = await supabase.from('matches').insert(nextMatches);
        if (error) throw error;
      }

      if (showToast) toast({ title: 'تم إنشاء الجولة التالية', description: `${nextMatches.length} مباراة جديدة` });
      return true;
    } catch (error: any) {
      console.error('Error generating next round:', error);
      if (showToast) toast({ title: 'خطأ', description: error.message || 'فشل في إنشاء الجولة التالية', variant: 'destructive' });
      return null;
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
    deleteTournament,
    addTeams,
    performAIDraw,
    generateKnockoutMatches,
    generateGroupMatches,
    startKnockoutFromGroups,
    updateStandings,
    updateMatchResult,
    generateNextRound,
  };
}
