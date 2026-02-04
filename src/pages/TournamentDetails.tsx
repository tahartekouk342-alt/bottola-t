import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TournamentSidebar } from '@/components/layout/TournamentSidebar';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { UpdateMatchDialog } from '@/components/tournament/UpdateMatchDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowRight,
  Trophy,
  Users,
  Calendar,
  GitBranch,
  TableIcon,
  Trash2,
} from 'lucide-react';
import { useTournamentDetails, type MatchWithTeams } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';

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
  const {
    tournament,
    teams,
    matches,
    standings,
    loading,
    getRoundName,
  } = useTournamentDetails(id);
  const { updateMatchResult, deleteTournament } = useTournaments();

  const [selectedMatch, setSelectedMatch] = useState<MatchWithTeams | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);

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

  const handleUpdateMatch = async (
    matchId: string,
    homeScore: number,
    awayScore: number
  ) => {
    return await updateMatchResult(matchId, homeScore, awayScore);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm('هل أنت متأكد من حذف هذه البطولة؟')) {
      const success = await deleteTournament(id);
      if (success) {
        navigate('/tournaments');
      }
    }
  };

  // Calculate total rounds for knockout
  const totalRounds = Math.ceil(Math.log2(teams.length));

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <TournamentSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!tournament) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <TournamentSidebar />
          <main className="flex-1 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">البطولة غير موجودة</h1>
              <Button onClick={() => navigate('/tournaments')}>
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للبطولات
              </Button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const winner = tournament.status === 'completed' && matches.length > 0
    ? matches.find(m => m.round === totalRounds)?.winner
    : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TournamentSidebar
          tournamentId={id}
          tournamentName={tournament.name}
          tournamentType={tournament.type}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/tournaments')}
              className="mb-4"
            >
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
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {typeMap[tournament.type]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {teams.length} فريق
                  </span>
                  {tournament.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(tournament.start_date).toLocaleDateString('ar-SA')}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 ml-2" />
                حذف البطولة
              </Button>
            </div>

            {/* Winner Banner */}
            {winner && (
              <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-primary" />
                <h2 className="text-xl font-bold text-primary mb-1">🏆 البطل</h2>
                <p className="text-2xl font-display font-bold">{winner.name}</p>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="bracket" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  شجرة البطولة
                </TabsTrigger>
                <TabsTrigger value="matches" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  المباريات
                </TabsTrigger>
                <TabsTrigger value="teams" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  الفرق
                </TabsTrigger>
                {(tournament.type === 'league' || tournament.type === 'groups') && (
                  <TabsTrigger value="standings" className="flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    الترتيب
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Bracket Tab */}
              <TabsContent value="bracket">
                <div className="rounded-xl border bg-card p-4">
                  <BracketView
                    matches={matches}
                    getRoundName={(round) => getRoundName(round, totalRounds)}
                    onMatchClick={handleMatchClick}
                  />
                </div>
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches">
                <div className="rounded-xl border bg-card p-4">
                  <MatchesList
                    matches={matches}
                    onMatchClick={handleMatchClick}
                    getRoundName={getRoundName}
                  />
                </div>
              </TabsContent>

              {/* Teams Tab */}
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

              {/* Standings Tab */}
              <TabsContent value="standings">
                {standings.length > 0 ? (
                  <div className="rounded-xl border bg-card overflow-hidden">
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
                        {standings.map((standing, index) => (
                          <TableRow key={standing.id}>
                            <TableCell className="font-bold">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {teams.find((t) => t.id === standing.team_id)?.name}
                            </TableCell>
                            <TableCell className="text-center">{standing.played}</TableCell>
                            <TableCell className="text-center">{standing.won}</TableCell>
                            <TableCell className="text-center">{standing.drawn}</TableCell>
                            <TableCell className="text-center">{standing.lost}</TableCell>
                            <TableCell className="text-center">{standing.goals_for}</TableCell>
                            <TableCell className="text-center">{standing.goals_against}</TableCell>
                            <TableCell className="text-center">{standing.goal_difference}</TableCell>
                            <TableCell className="text-center font-bold text-primary">
                              {standing.points}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    لا توجد بيانات ترتيب بعد
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Update Match Dialog */}
        <UpdateMatchDialog
          match={selectedMatch}
          open={matchDialogOpen}
          onOpenChange={setMatchDialogOpen}
          onUpdate={handleUpdateMatch}
        />
      </div>
    </SidebarProvider>
  );
}
