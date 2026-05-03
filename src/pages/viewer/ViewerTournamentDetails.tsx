import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Trophy, Users, Loader2, GitBranch, TableIcon, UserPlus, Swords, Plus, X, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { VictoryConfetti } from '@/components/effects/VictoryConfetti';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ViewerTournamentDetails() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');
  const [showVictory, setShowVictory] = useState(false);

  const { tournament, teams, matches, standings, loading, getRoundName } = useTournamentDetails(tournamentId || '');

  const tabs = [
    { id: 'matches', label: t('tournament.tabMatches'), icon: Swords },
    { id: 'teams', label: t('tournament.tabTeams'), icon: Users },
    { id: 'bracket', label: t('tournament.tabBracket'), icon: GitBranch },
    { id: 'standings', label: t('tournament.tabStandings'), icon: TableIcon },
  ];

  const knockoutMatches = matches.filter(m => !m.group_name);
  const groupMatches = matches.filter(m => m.group_name);
  const currentMaxRound = knockoutMatches.length > 0 ? Math.max(...knockoutMatches.map(m => m.round)) : 0;
  const winnerTeam = tournament?.status === 'completed' && knockoutMatches.length > 0
    ? knockoutMatches.find(m => m.round === currentMaxRound && m.status === 'completed')?.winner : null;
  const leagueWinner = tournament?.status === 'completed' && tournament?.type === 'league' && standings.length > 0
    ? teams.find(t => t.id === [...standings].sort((a, b) => (b.points || 0) - (a.points || 0))[0]?.team_id) : null;
  const winner = winnerTeam || leagueWinner || null;
  const finalMatch = knockoutMatches.find(m => m.round === currentMaxRound && m.status === 'completed');
  const manOfMatch = (finalMatch as any)?.man_of_match_name;

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => setShowVictory(true), 600);
      return () => clearTimeout(timer);
    }
  }, [winner?.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t('tournament.tournamentNotFound')}</h2>
            <Button onClick={() => navigate('/home')}>{t('common.back')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const showStandings = tournament.type === 'league' || tournament.type === 'groups';
  const showJoin = tournament.accept_join_requests;
  const sportType = (tournament as any).sport_type || 'football';

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'standings' && !showStandings) return false;
    if (tab.id === 'join' && !showJoin) return false;
    if (tab.id === 'bracket' && tournament.type === 'league') return false;
    return true;
  });

  const totalRounds = Math.ceil(Math.log2(Math.max(teams.length, 2)));

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <VictoryConfetti
        trigger={showVictory}
        teamName={winner?.name}
        teamLogo={winner?.logo_url}
        sportType={sportType}
        onComplete={() => setShowVictory(false)}
      />

      <div className="relative">
        <div className="relative h-56 md:h-72">
          <img src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt={tournament.venue_name || 'stadium'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />

          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}
            className="absolute top-4 end-4 z-20 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-xl">
            <BackIcon className="w-4 h-4 me-1" />{t('common.back')}
          </Button>

          <div className="absolute bottom-4 end-4 start-4 z-10 flex items-end gap-3">
            {tournament.logo_url ? (
              <img src={tournament.logo_url} alt={tournament.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white/80 shadow-lg" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg border-2 border-white/80">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
              <p className="text-sm text-white/80 drop-shadow">{teams.length} {t('tournament.teams')} · {matches.length} {t('tournament.matches')}</p>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
          <div className="overflow-x-auto">
            <div className="flex min-w-max">
              {visibleTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-5 py-3 text-xs font-bold border-b-[3px] transition-colors whitespace-nowrap flex-1',
                    activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}>
                  <tab.icon className="w-5 h-5" />{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Champion banner */}
        {winner && (
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
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {groupMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  {t('tournament.groupStageLabel')}
                </h3>
                <MatchesList matches={groupMatches} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
              </div>
            )}
            {knockoutMatches.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-destructive" />
                  </div>
                  {t('tournament.knockoutStageLabel')}
                </h3>
                <MatchesList matches={knockoutMatches} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
              </div>
            )}
            {groupMatches.length === 0 && knockoutMatches.length === 0 && (
              <MatchesList matches={matches} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {teams.map((team) => (
              <Card key={team.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{team.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-bold text-sm truncate block">{team.name}</span>
                    {team.group_name && <span className="text-xs text-muted-foreground">{t('tournament.groupLabel')} {team.group_name}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'bracket' && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <BracketView matches={knockoutMatches.length > 0 ? knockoutMatches : matches} getRoundName={(round) => getRoundName(round, totalRounds)} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'standings' && showStandings && standings.length > 0 && (
          <div className="space-y-6">
            {(() => {
              const grouped = standings.reduce((acc, s) => {
                const key = s.group_name || 'all';
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
                      <span className="font-bold text-primary">{t('tournament.groupLabel')} {groupName}</span>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{t('standings.team')}</TableHead>
                        <TableHead className="text-center">{t('standings.played')}</TableHead>
                        <TableHead className="text-center">{t('standings.won')}</TableHead>
                        <TableHead className="text-center">{t('standings.drawn')}</TableHead>
                        <TableHead className="text-center">{t('standings.lost')}</TableHead>
                        <TableHead className="text-center">{t('standings.goalDiff')}</TableHead>
                        <TableHead className="text-center font-bold text-primary">{t('standings.points')}</TableHead>
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
                                  <span className="font-medium text-sm">{team?.name || '?'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-sm">{standing.played || 0}</TableCell>
                              <TableCell className="text-center text-sm">{standing.won || 0}</TableCell>
                              <TableCell className="text-center text-sm">{standing.drawn || 0}</TableCell>
                              <TableCell className="text-center text-sm">{standing.lost || 0}</TableCell>
                              <TableCell className={cn('text-center text-sm font-semibold',
                                (standing.goal_difference || 0) > 0 && 'text-primary',
                                (standing.goal_difference || 0) < 0 && 'text-destructive')}>
                                {(standing.goal_difference || 0) > 0 ? `+${standing.goal_difference}` : standing.goal_difference || 0}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 font-bold text-primary">{standing.points || 0}</span>
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
        )}

        {activeTab === 'join' && showJoin && tournamentId && (
          <JoinRequestInline tournamentId={tournamentId} />
        )}
      </div>
    </div>
  );
}

function JoinRequestInline({ tournamentId }: { tournamentId: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddPlayer = () => {
    if (newPlayer.trim() && !playerNames.includes(newPlayer.trim())) {
      setPlayerNames(prev => [...prev, newPlayer.trim()]);
      setNewPlayer('');
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      toast({ title: t('tournament.enterTeamName'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await supabase.from('join_requests').insert({
        tournament_id: tournamentId,
        team_name: teamName.trim(),
        player_names: playerNames,
        requested_by: user?.id || null,
      });
      toast({ title: t('tournament.requestSent') });
      setTeamName('');
      setPlayerNames([]);
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary via-primary/50 to-primary" />
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t('tournament.joinRequest')}</h3>
            <p className="text-sm text-muted-foreground">{t('tournament.joinDesc')}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">{t('tournament.teamName')}</label>
          <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">{t('tournament.players')} ({playerNames.length})</label>
          <div className="flex gap-2 mb-2">
            <Input placeholder={t('tournament.playerName')} value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()} className="flex-1" />
            <Button onClick={handleAddPlayer} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
          {playerNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {playerNames.map((name, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pe-1">
                  {name}
                  <button onClick={() => setPlayerNames(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Send className="w-4 h-4 me-2" />}
          {t('tournament.submitRequest')}
        </Button>
      </CardContent>
    </Card>
  );
}
