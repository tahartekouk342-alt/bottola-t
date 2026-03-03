import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';
import { JoinRequestsPanel } from '@/components/tournament/JoinRequestsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowRight, Trophy, Users, Calendar, GitBranch, TableIcon, Trash2, Plus, Play, Loader2, MapPin, Clock, X, UserPlus,
} from 'lucide-react';
import { useTournamentDetails, type MatchWithTeams } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const statusMap = {
  draft: { label: 'مسودة', variant: 'secondary' as const },
  upcoming: { label: 'قريباً', variant: 'default' as const },
  live: { label: 'جارية', variant: 'destructive' as const },
  completed: { label: 'منتهية', variant: 'outline' as const },
};

const typeMap = {
  knockout: 'إقصاء مباشر',
  league: 'دوري',
  groups: 'مجموعات + إقصاء',
};

const tabs = [
  { id: 'bracket', label: 'شجرة الإقصاء', icon: GitBranch },
  { id: 'matches', label: 'المباريات', icon: Calendar },
  { id: 'teams', label: 'الفرق', icon: Users },
  { id: 'standings', label: 'الترتيب', icon: TableIcon },
  { id: 'requests', label: 'طلبات الانضمام', icon: UserPlus },
];

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    tournament, teams, matches, standings, loading, getRoundName, fetchTournamentDetails,
  } = useTournamentDetails(id);
  const { updateMatchResult, deleteTournament, addTeams, generateKnockoutMatches, startKnockoutFromGroups } = useTournaments();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [showAddTeams, setShowAddTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [addingTeams, setAddingTeams] = useState(false);

  const currentTab = searchParams.get('tab') || 'bracket';
  const handleTabChange = (value: string) => setSearchParams({ tab: value });

  const handleMatchClick = (match: MatchWithTeams) => {
    if (match.status !== 'completed') {
      setSelectedMatch(match);
      setMatchDialogOpen(true);
    }
  };

  const handleUpdateMatch = async (matchId: string, homeScore: number, awayScore: number) => {
    const result = await updateMatchResult(matchId, homeScore, awayScore);
    if (result) fetchTournamentDetails();
    return result;
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm('هل أنت متأكد من حذف هذه البطولة؟')) {
      const success = await deleteTournament(id);
      if (success) navigate(`${ORGANIZER_BASE}/dashboard`);
    }
  };

  const handleStartTournament = async () => {
    if (!id) return;
    try {
      if (tournament?.type === 'groups') {
        // Start knockout from groups
        await startKnockoutFromGroups(id);
      } else {
        await supabase.from('tournaments').update({ status: 'live' }).eq('id', id);
        toast({ title: 'تم بدء البطولة 🔴' });
      }
      fetchTournamentDetails();
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' });
    }
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
        if (allTeams && tournament?.type === 'knockout') {
          await generateKnockoutMatches(id, allTeams);
        }
      }
      toast({ title: 'تم إضافة الفرق ✅' });
      setTeamsList([]);
      setShowAddTeams(false);
      fetchTournamentDetails();
    } catch {
      toast({ title: 'خطأ في إضافة الفرق', variant: 'destructive' });
    } finally {
      setAddingTeams(false);
    }
  };

  const totalRounds = Math.ceil(Math.log2(Math.max(teams.length, 2)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background p-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold mb-4">البطولة غير موجودة</h1>
        <Button onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)}>
          <ArrowRight className="w-4 h-4 ml-2" />العودة للبطولات
        </Button>
      </div>
    );
  }

  const winner = tournament.status === 'completed' && matches.length > 0
    ? matches.find(m => m.round === totalRounds)?.winner : null;
  const canAddTeams = teams.length === 0 && matches.length === 0;
  const canStart = tournament.status !== 'live' && tournament.status !== 'completed' && (matches.length > 0 || (tournament.type === 'groups' && teams.length > 0));

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'standings' && tournament.type === 'knockout') return false;
    if (tab.id === 'requests' && !tournament.accept_join_requests) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Tournament Header with Stadium Image */}
      <div className="relative border-b overflow-hidden">
        {/* Stadium Background */}
        <div className="relative h-56 md:h-72">
          <img
            src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'}
            alt={tournament.venue_name || 'ملعب'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-background" />

          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)}
            className="absolute top-4 right-4 z-20 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-xl"
          >
            <ArrowRight className="w-4 h-4 ml-1" />رجوع
          </Button>

          {/* Tournament Info Overlay */}
          <div className="absolute bottom-4 right-4 left-4 z-10 flex items-end justify-between">
            <div className="flex items-center gap-3">
              {tournament.logo_url ? (
                <img src={tournament.logo_url} alt={tournament.name} className="w-14 h-14 rounded-xl object-cover border-2 border-white/80 shadow-lg" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg border-2 border-white/80">
                  <Trophy className="w-7 h-7 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-white drop-shadow-lg">{tournament.name}</h1>
                <p className="text-sm text-white/80 drop-shadow">{teams.length} فريق · {matches.length} مباراة</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {canStart && (
                <Button onClick={handleStartTournament} className="gradient-primary text-primary-foreground" size="sm">
                  <Play className="w-4 h-4 ml-1" />
                  {tournament.type === 'groups' ? 'بدء الإقصاء' : 'بدء'}
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete} size="sm">
                <Trash2 className="w-4 h-4 ml-1" />حذف
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Tabs Bar */}
        {(teams.length > 0 || matches.length > 0 || tournament.accept_join_requests) && (
          <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-t">
            <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      currentTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Winner Banner */}
        {winner && (
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-primary" />
            <h2 className="text-xl font-bold text-primary mb-1">🏆 البطل</h2>
            <p className="text-2xl font-display font-bold">{winner.name}</p>
          </div>
        )}

        {/* Add Teams */}
        {canAddTeams && (
          <Card className="mb-6">
            <CardContent className="p-6">
              {!showAddTeams ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">لا توجد فرق بعد</h3>
                  <p className="text-muted-foreground mb-4">أضف الفرق المشاركة لبدء البطولة</p>
                  <Button onClick={() => setShowAddTeams(true)} className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 ml-2" />إضافة فرق
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">إضافة الفرق</h3>
                  <div className="flex gap-2">
                    <Input placeholder="اسم الفريق" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()} className="flex-1" />
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
                  <p className="text-sm text-muted-foreground">عدد الفرق: {teamsList.length} / {tournament.num_teams}</p>
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
          <div className="rounded-xl border bg-card p-4">
            <BracketView matches={matches} getRoundName={(round) => getRoundName(round, totalRounds)} onMatchClick={handleMatchClick} />
          </div>
        )}

        {currentTab === 'matches' && (
          <div className="rounded-xl border bg-card p-4">
            <MatchesList matches={matches} onMatchClick={handleMatchClick} getRoundName={getRoundName} venueName={tournament.venue_name || undefined} stadiumImageUrl={tournament.venue_photos?.[0] || undefined} />
          </div>
        )}

        {currentTab === 'teams' && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">الفريق</TableHead>
                  <TableHead className="text-right">المجموعة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team, index) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.group_name || '-'}</TableCell>
                    <TableCell>
                      {team.is_eliminated ? <Badge variant="destructive">خرج</Badge> : <Badge variant="default">مستمر</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  <div key={groupName} className="rounded-xl border bg-card overflow-hidden">
                    {Object.keys(grouped).length > 1 && (
                      <div className="px-4 py-2 bg-primary/10 font-bold text-primary">المجموعة {groupName}</div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">الفريق</TableHead>
                          <TableHead className="text-center">لعب</TableHead>
                          <TableHead className="text-center">فوز</TableHead>
                          <TableHead className="text-center">تعادل</TableHead>
                          <TableHead className="text-center">خسارة</TableHead>
                          <TableHead className="text-center">له</TableHead>
                          <TableHead className="text-center">عليه</TableHead>
                          <TableHead className="text-center">الفارق</TableHead>
                          <TableHead className="text-center">النقاط</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupStandings
                          .sort((a, b) => (b.points || 0) - (a.points || 0) || (b.goal_difference || 0) - (a.goal_difference || 0))
                          .map((standing, index) => (
                            <TableRow key={standing.id}>
                              <TableCell className="font-bold">{index + 1}</TableCell>
                              <TableCell className="font-medium">{teams.find((t) => t.id === standing.team_id)?.name}</TableCell>
                              <TableCell className="text-center">{standing.played || 0}</TableCell>
                              <TableCell className="text-center">{standing.won || 0}</TableCell>
                              <TableCell className="text-center">{standing.drawn || 0}</TableCell>
                              <TableCell className="text-center">{standing.lost || 0}</TableCell>
                              <TableCell className="text-center">{standing.goals_for || 0}</TableCell>
                              <TableCell className="text-center">{standing.goals_against || 0}</TableCell>
                              <TableCell className="text-center">{standing.goal_difference || 0}</TableCell>
                              <TableCell className="text-center font-bold text-primary">{standing.points || 0}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">لا توجد بيانات ترتيب بعد</div>
          )
        )}

        {currentTab === 'requests' && id && (
          <JoinRequestsPanel tournamentId={id} />
        )}
      </div>

      <UpdateMatchDialog match={selectedMatch} open={matchDialogOpen} onOpenChange={setMatchDialogOpen} onUpdate={handleUpdateMatch} />
    </div>
  );
}
