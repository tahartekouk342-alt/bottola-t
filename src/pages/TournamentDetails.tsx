import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowRight, Trophy, Users, Calendar, GitBranch, TableIcon, Trash2, Plus, Play, Loader2,
} from 'lucide-react';
import { useTournamentDetails, type MatchWithTeams } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const statusMap = {
  draft: { label: 'مسودة', variant: 'secondary' as const },
  upcoming: { label: 'قريباً', variant: 'default' as const },
  live: { label: 'جارية', variant: 'destructive' as const },
  completed: { label: 'منتهية', variant: 'outline' as const },
};

const typeMap = {
  knockout: 'خروج المغلوب',
  league: 'دوري',
  groups: 'مجموعات',
};

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    tournament, teams, matches, standings, loading, getRoundName, fetchTournamentDetails,
  } = useTournamentDetails(id);
  const { updateMatchResult, deleteTournament, addTeams, generateKnockoutMatches, generateLeagueMatches } = useTournaments();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  
  // Add teams state
  const [showAddTeams, setShowAddTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [addingTeams, setAddingTeams] = useState(false);

  const currentTab = searchParams.get('tab') || 'bracket';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleMatchClick = (match: MatchWithTeams) => {
    if (match.status !== 'completed') {
      setSelectedMatch(match);
      setMatchDialogOpen(true);
    }
  };

  const handleUpdateMatch = async (matchId: string, homeScore: number, awayScore: number) => {
    const result = await updateMatchResult(matchId, homeScore, awayScore);
    if (result) {
      fetchTournamentDetails();
    }
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
      await supabase.from('tournaments').update({ status: 'live' }).eq('id', id);
      toast({ title: 'تم بدء البطولة 🔴' });
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

  const handleRemoveTeam = (index: number) => {
    setTeamsList(prev => prev.filter((_, i) => i !== index));
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
          } else if (tournament?.type === 'league') {
            await generateLeagueMatches(id, allTeams);
          }
        }
      }
      toast({ title: 'تم إضافة الفرق وإنشاء المباريات ✅' });
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
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للبطولات
        </Button>
      </div>
    );
  }

  const winner = tournament.status === 'completed' && matches.length > 0
    ? matches.find(m => m.round === totalRounds)?.winner
    : null;

  const canAddTeams = teams.length === 0 && matches.length === 0;
  const canStart = tournament.status !== 'live' && tournament.status !== 'completed' && matches.length > 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(`${ORGANIZER_BASE}/dashboard`)} className="mb-4">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للبطولات
        </Button>

        {/* Tournament Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {tournament.name}
              </h1>
              <Badge variant={statusMap[tournament.status].variant}>
                {statusMap[tournament.status].label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-1"><Trophy className="w-4 h-4" />{typeMap[tournament.type]}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{teams.length} فريق</span>
              {tournament.start_date && (
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(tournament.start_date).toLocaleDateString('ar-SA')}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canStart && (
              <Button onClick={handleStartTournament} className="gradient-primary text-primary-foreground">
                <Play className="w-4 h-4 ml-2" />
                بدء البطولة
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </Button>
          </div>
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-primary" />
            <h2 className="text-xl font-bold text-primary mb-1">🏆 البطل</h2>
            <p className="text-2xl font-display font-bold">{winner.name}</p>
          </div>
        )}

        {/* Add Teams Section (if no teams yet) */}
        {canAddTeams && (
          <Card className="mb-8">
            <CardContent className="p-6">
              {!showAddTeams ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">لا توجد فرق بعد</h3>
                  <p className="text-muted-foreground mb-4">أضف الفرق المشاركة لبدء البطولة</p>
                  <Button onClick={() => setShowAddTeams(true)} className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة فرق
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">إضافة الفرق</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="اسم الفريق"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddTeam} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {teamsList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {teamsList.map((team, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{index + 1}</span>
                            <span className="font-medium text-sm truncate">{team}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveTeam(index)} className="h-6 w-6 p-0 text-destructive">×</Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    عدد الفرق: {teamsList.length} / {tournament.num_teams}
                  </p>

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

        {/* Tabs */}
        {(teams.length > 0 || matches.length > 0) && (
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="bracket" className="flex items-center gap-2"><GitBranch className="w-4 h-4" />شجرة البطولة</TabsTrigger>
              <TabsTrigger value="matches" className="flex items-center gap-2"><Calendar className="w-4 h-4" />المباريات</TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2"><Users className="w-4 h-4" />الفرق</TabsTrigger>
              {(tournament.type === 'league' || tournament.type === 'groups') && (
                <TabsTrigger value="standings" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />الترتيب</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="bracket">
              <div className="rounded-xl border bg-card p-4">
                <BracketView
                  matches={matches}
                  getRoundName={(round) => getRoundName(round, totalRounds)}
                  onMatchClick={handleMatchClick}
                />
              </div>
            </TabsContent>

            <TabsContent value="matches">
              <div className="rounded-xl border bg-card p-4">
                <MatchesList matches={matches} onMatchClick={handleMatchClick} getRoundName={getRoundName} />
              </div>
            </TabsContent>

            <TabsContent value="teams">
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
                          {team.is_eliminated ? (
                            <Badge variant="destructive">خرج</Badge>
                          ) : (
                            <Badge variant="default">مستمر</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="standings">
              {standings.length > 0 ? (
                <div className="space-y-6">
                  {(() => {
                    // Group standings by group_name
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
                                <TableCell className="font-medium">
                                  {teams.find((t) => t.id === standing.team_id)?.name}
                                </TableCell>
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
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <UpdateMatchDialog
        match={selectedMatch}
        open={matchDialogOpen}
        onOpenChange={setMatchDialogOpen}
        onUpdate={handleUpdateMatch}
      />
    </div>
  );
}
