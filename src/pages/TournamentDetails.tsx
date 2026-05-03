import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';
// JoinRequestsPanel removed — feature deprecated
import { EditTeamDialog } from '@/components/tournament/EditTeamDialog';
import { VictoryConfetti } from '@/components/effects/VictoryConfetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowRight, Trophy, Users, Calendar, GitBranch, TableIcon, Trash2, Plus, Play, Loader2, X, UserPlus, SkipForward, Edit, Star,
} from 'lucide-react';
import { useTournamentDetails, type MatchWithTeams } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function TournamentDetails() {
  const { t } = useTranslation();
  const statusMap: Record<string, { label: string; variant: any }> = {
    draft: { label: t('tournament.draft'), variant: 'secondary' },
    upcoming: { label: t('tournament.upcoming'), variant: 'default' },
    live: { label: t('tournament.live').replace('🔴 ', ''), variant: 'destructive' },
    completed: { label: t('tournament.completed'), variant: 'outline' },
  };
  const typeMap: Record<string, string> = {
    knockout: t('tournament.knockout'),
    league: t('tournament.league'),
    groups: t('tournament.groupsKnockout'),
  };
  const tabs = [
    { id: 'matches', label: t('tournament.tabMatches'), icon: Calendar },
    { id: 'bracket', label: t('tournament.tabBracket'), icon: GitBranch },
    { id: 'teams', label: t('tournament.tabTeams'), icon: Users },
    { id: 'standings', label: t('tournament.tabStandings'), icon: TableIcon },
  ];

  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    tournament, teams, matches, standings, loading, getRoundName, fetchTournamentDetails,
  } = useTournamentDetails(id);
  const { updateMatchResult, deleteTournament, addTeams, generateKnockoutMatches, generateGroupMatches, performAIDraw, startKnockoutFromGroups, generateNextRound } = useTournaments();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [showAddTeams, setShowAddTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [addingTeams, setAddingTeams] = useState(false);
  const [editTeam, setEditTeam] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);
  const [showVictory, setShowVictory] = useState(false);

  const currentTab = searchParams.get('tab') || 'matches';
  const handleTabChange = (value: string) => setSearchParams({ tab: value });

  const handleMatchClick = (match: MatchWithTeams) => {
    if (match.status !== 'completed') {
      setSelectedMatch(match);
      setMatchDialogOpen(true);
    }
  };

  const handleUpdateMatch = async (matchId: string, homeScore: number, awayScore: number, manOfMatch?: string, sets?: any) => {
    const result = await updateMatchResult(matchId, homeScore, awayScore, manOfMatch, sets);
    if (result) fetchTournamentDetails();
    return result;
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(t('tournament.deleteConfirm'))) {
      const success = await deleteTournament(id);
      if (success) navigate(`${ORGANIZER_BASE}/dashboard`);
    }
  };

  const handleStartTournament = async () => {
    if (!id) return;
    try {
      if (tournament?.type === 'groups') {
        // Start knockout phase from groups
        const result = await startKnockoutFromGroups(id);
        if (result) fetchTournamentDetails();
      } else {
        // Knockout and league: just set status to live
        await supabase.from('tournaments').update({ status: 'live' }).eq('id', id);
        toast({ title: t('tournament.started') });
        fetchTournamentDetails();
      }
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleNextRound = async () => {
    if (!id) return;
    await generateNextRound(id);
    fetchTournamentDetails();
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamsList.includes(newTeamName.trim())) {
      setTeamsList(prev => [...prev, newTeamName.trim()]);
      setNewTeamName('');
    }
  };

  const handleSaveTeams = async () => {
    if (!id || teamsList.length < 2) {
      toast({ title: 'أدخل فريقين على الأقل', variant: 'destructive' });
      return;
    }
    setAddingTeams(true);
    try {
      const newTeams = await addTeams(id, teamsList);
      if (newTeams) {
        const { data: allTeams } = await supabase.from('teams').select('*').eq('tournament_id', id).order('seed');
        if (allTeams) {
          if (tournament?.type === 'knockout') {
            await generateKnockoutMatches(id, allTeams);
          } else if (tournament?.type === 'groups') {
            // Perform draw and generate group matches
            const numGroups = tournament.num_groups || Math.max(2, Math.floor(allTeams.length / (tournament.teams_per_group || 4)));
            const drawResult = await performAIDraw(allTeams.map(t => t.name), 'groups', numGroups);
            if (drawResult?.groups) {
              await generateGroupMatches(id, allTeams, drawResult.groups);
            }
          }
        }
      }
      toast({ title: t('common.success') + ' ✅' });
      setTeamsList([]);
      setShowAddTeams(false);
      fetchTournamentDetails();
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setAddingTeams(false);
    }
  };

  const totalRounds = Math.ceil(Math.log2(Math.max(teams.length, 2)));

  const knockoutMatches = matches.filter(m => !m.group_name);
  const groupMatches = matches.filter(m => m.group_name);
  const currentMaxRound = knockoutMatches.length > 0 ? Math.max(...knockoutMatches.map(m => m.round)) : 0;
  const currentRoundMatches = knockoutMatches.filter(m => m.round === currentMaxRound);
  const allCurrentRoundCompleted = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'completed');
  const canGenerateNextRound = allCurrentRoundCompleted && currentRoundMatches.length > 1;

  const allGroupMatchesCompleted = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');
  const canStartKnockout = tournament?.type === 'groups' && allGroupMatchesCompleted && knockoutMatches.length === 0;

  const winnerTeam = tournament?.status === 'completed' && knockoutMatches.length > 0
    ? knockoutMatches.find(m => m.round === currentMaxRound && m.status === 'completed')?.winner : null;
  const leagueWinner = tournament?.status === 'completed' && tournament?.type === 'league' && standings.length > 0
    ? teams.find(t => t.id === [...standings].sort((a, b) => (b.points || 0) - (a.points || 0))[0]?.team_id) : null;
  const winner = winnerTeam || leagueWinner || null;

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => setShowVictory(true), 500);
      return () => clearTimeout(timer);
    }
  }, [winner?.id]);

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('tournament.tournamentNotFound')}</h1>
        <Button onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)}>
          <ArrowRight className="w-4 h-4 ml-2" />{t('tournament.backToTournaments')}
        </Button>
      </div>
    );
  }

  const canAddTeams = teams.length === 0 && matches.length === 0;
  const canStart = tournament.status !== 'live' && tournament.status !== 'completed' && matches.length > 0 && tournament.type !== 'groups';

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'bracket' && tournament.type === 'league') return false;
    if (tab.id === 'standings' && tournament.type === 'knockout') return false;
    return true;
  });

  const sportType = (tournament as any).sport_type || 'football';
  const sportEmoji = sportType === 'basketball' ? '🏀' : '⚽';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Victory Celebration */}
      <VictoryConfetti
        trigger={showVictory}
        teamName={winner?.name}
        teamLogo={winner?.logo_url}
        sportType={sportType}
        onComplete={() => setShowVictory(false)}
      />

      {/* Hero */}
      <div className="relative border-b overflow-hidden">
        <div className="relative h-48 md:h-64">
          <img src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt={tournament.venue_name || 'ملعب'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-background" />

          <Button variant="ghost" size="sm" onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)}
            className="absolute top-3 right-3 z-20 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-xl">
            <ArrowRight className="w-4 h-4 ml-1" />{t('common.back')}
          </Button>

          <div className="absolute bottom-3 right-3 left-3 z-10 flex items-end justify-between">
            <div className="flex items-center gap-3">
              {tournament.logo_url ? (
                <img src={tournament.logo_url} alt={tournament.name} className="w-12 h-12 rounded-xl object-cover border-2 border-white/80 shadow-lg" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg border-2 border-white/80">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="font-display text-lg md:text-xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant={statusMap[tournament.status]?.variant || 'secondary'} className="text-xs">
                    {statusMap[tournament.status]?.label}
                  </Badge>
                  <span className="text-xs text-white/80 drop-shadow">{sportEmoji} {teams.length} {t('tournament.teams')} · {matches.length} {t('tournament.matches')} · {typeMap[tournament.type]}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {canGenerateNextRound && (
                <Button onClick={handleNextRound} size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm text-xs">
                  <SkipForward className="w-3.5 h-3.5 ml-1" />{t('tournament.nextRound')}
                </Button>
              )}
              {canStartKnockout && (
                <Button onClick={handleStartTournament} className="gradient-primary text-primary-foreground text-xs" size="sm">
                  <Play className="w-3.5 h-3.5 ml-1" />{t('tournament.startKnockout')}
                </Button>
              )}
              {canStart && (
                <Button onClick={handleStartTournament} className="gradient-primary text-primary-foreground text-xs" size="sm">
                  <Play className="w-3.5 h-3.5 ml-1" />{t('tournament.start')}
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete} size="sm"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {(teams.length > 0 || matches.length > 0 || tournament.accept_join_requests) && (
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-t">
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {visibleTabs.map((tab) => (
                  <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                    className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      currentTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Winner Banner */}
        {winner && (() => {
          const finalMatch = knockoutMatches.find(m => m.round === currentMaxRound && m.status === 'completed');
          const manOfMatch = (finalMatch as any)?.man_of_match_name;
          return (
            <div className="mb-6 relative overflow-hidden rounded-2xl border-2 border-yellow-400/30 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-primary/10 to-yellow-400/10" />
              <div className="relative p-6 text-center">
                {winner.logo_url ? (
                  <img src={winner.logo_url} alt={winner.name} className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-4 border-yellow-400/50 shadow-xl" />
                ) : (
                  <Trophy className="w-14 h-14 mx-auto mb-3 text-yellow-500 drop-shadow-lg" />
                )}
                <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">🏆 {t('tournament.champion')} 🏆</h2>
                <p className="text-2xl font-display font-black">{winner.name}</p>
                {manOfMatch && (
                  <div className="mt-3 pt-3 border-t border-yellow-400/20 inline-flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-muted-foreground">{t('tournament.manOfMatchFinal')}:</span>
                    <span className="font-bold">{manOfMatch}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Add Teams */}
        {canAddTeams && (
          <Card className="mb-6 overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/images/sport-football.jpg)', backgroundSize: 'cover' }} />
            <CardContent className="p-6 relative">
              {!showAddTeams ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t('tournament.noTeamsYet')}</h3>
                  <p className="text-muted-foreground mb-4">{t('tournament.addTeamsHint')}</p>
                  <Button onClick={() => setShowAddTeams(true)} className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 ml-2" />{t('tournament.addTeams')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">{t('tournament.addTeams')}</h3>
                  <div className="flex gap-2">
                    <Input placeholder={t('tournament.teamName')} value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()} className="flex-1" />
                    <Button onClick={handleAddTeam} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                  </div>
                  {teamsList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {teamsList.map((team, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 rounded-xl border bg-card group hover:border-primary/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{index + 1}</span>
                            <span className="font-medium text-sm truncate">{team}</span>
                          </div>
                          <button onClick={() => setTeamsList(prev => prev.filter((_, i) => i !== index))} className="opacity-0 group-hover:opacity-100 text-destructive p-1"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">عدد الفرق: {teamsList.length}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTeams} disabled={addingTeams || teamsList.length < 2} className="gradient-primary text-primary-foreground">
                      {addingTeams ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trophy className="w-4 h-4 ml-2" />}
                      حفظ وإنشاء المباريات
                    </Button>
                    <Button variant="outline" onClick={() => { setShowAddTeams(false); setTeamsList([]); }}>إلغاء</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        {currentTab === 'bracket' && (
          <Card className="overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
              <div className="bg-card rounded-xl p-4">
                <BracketView matches={knockoutMatches.length > 0 ? knockoutMatches : matches} getRoundName={(round) => getRoundName(round, totalRounds)} onMatchClick={handleMatchClick} />
              </div>
            </div>
          </Card>
        )}

        {currentTab === 'matches' && (
          <div className="space-y-4">
            {/* Group Matches */}
            {groupMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  مرحلة المجموعات
                </h3>
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <MatchesList matches={groupMatches} onMatchClick={handleMatchClick} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
                  </CardContent>
                </Card>
              </div>
            )}
            {/* Knockout Matches */}
            {knockoutMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-destructive" />
                  </div>
                  مرحلة الإقصاء
                </h3>
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <MatchesList matches={knockoutMatches} onMatchClick={handleMatchClick} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
                  </CardContent>
                </Card>
              </div>
            )}
            {groupMatches.length === 0 && knockoutMatches.length === 0 && (
              <Card>
                <CardContent className="p-4">
                  <MatchesList matches={matches} onMatchClick={handleMatchClick} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentTab === 'teams' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team, index) => (
              <Card key={team.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    index < 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{index + 1}</span>
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">{team.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm block truncate">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.group_name ? `المجموعة ${team.group_name}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {team.is_eliminated ? <Badge variant="destructive" className="text-xs">خرج</Badge> : <Badge variant="default" className="text-xs">مستمر</Badge>}
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                      onClick={() => setEditTeam({ id: team.id, name: team.name, logoUrl: team.logo_url || undefined })}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {currentTab === 'standings' && (
          standings.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                const grouped = standings.reduce((acc, s) => {
                  const key = s.group_name || 'عام';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(s);
                  return acc;
                }, {} as Record<string, typeof standings>);

                return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, groupStandings]) => (
                  <Card key={groupName} className="overflow-hidden">
                    {Object.keys(grouped).length > 1 && (
                      <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent border-b flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{groupName}</span>
                        </div>
                        <span className="font-bold text-primary">المجموعة {groupName}</span>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-right w-12">#</TableHead>
                          <TableHead className="text-right">الفريق</TableHead>
                          <TableHead className="text-center">لعب</TableHead>
                          <TableHead className="text-center">فوز</TableHead>
                          <TableHead className="text-center">تعادل</TableHead>
                          <TableHead className="text-center">خسارة</TableHead>
                          <TableHead className="text-center">له</TableHead>
                          <TableHead className="text-center">عليه</TableHead>
                          <TableHead className="text-center">+/-</TableHead>
                          <TableHead className="text-center font-bold text-primary">نقاط</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupStandings
                          .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.goal_difference || 0) - (a.goal_difference || 0))
                          .map((standing, index) => {
                            const team = teams.find((t) => t.id === standing.team_id);
                            return (
                              <TableRow key={standing.id} className={cn(index < 2 && Object.keys(grouped).length > 1 && 'bg-primary/5')}>
                                <TableCell>
                                  <span className={cn('inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs',
                                    index < 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{index + 1}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {team?.logo_url ? <img src={team.logo_url} className="w-7 h-7 rounded-lg object-cover" /> : (
                                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">{team?.name?.charAt(0)}</div>
                                    )}
                                    <span className="font-medium">{team?.name || '?'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{standing.played || 0}</TableCell>
                                <TableCell className="text-center">{standing.won || 0}</TableCell>
                                <TableCell className="text-center">{standing.drawn || 0}</TableCell>
                                <TableCell className="text-center">{standing.lost || 0}</TableCell>
                                <TableCell className="text-center">{standing.goals_for || 0}</TableCell>
                                <TableCell className="text-center">{standing.goals_against || 0}</TableCell>
                                <TableCell className={cn('text-center font-semibold',
                                  (standing.goal_difference || 0) > 0 && 'text-primary',
                                  (standing.goal_difference || 0) < 0 && 'text-destructive')}>
                                  {(standing.goal_difference || 0) > 0 ? `+${standing.goal_difference}` : standing.goal_difference || 0}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">{standing.points || 0}</span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </Card>
                ));
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">لا توجد بيانات ترتيب بعد</CardContent>
            </Card>
          )
        )}

        {/* requests tab removed */}
      </div>

      <UpdateMatchDialog
        match={selectedMatch}
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        onUpdate={handleUpdateMatch}
        tournamentType={tournament?.type}
        sportType={(tournament as any)?.sport_type}
        volleyballFormat={(tournament as any)?.volleyball_format}
      />
      
      {editTeam && (
        <EditTeamDialog
          open={!!editTeam}
          onOpenChange={(open) => !open && setEditTeam(null)}
          teamId={editTeam.id}
          teamName={editTeam.name}
          teamLogoUrl={editTeam.logoUrl}
          onSave={() => fetchTournamentDetails()}
        />
      )}
    </div>
  );
}