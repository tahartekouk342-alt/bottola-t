import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Calendar, Users, Loader2, GitBranch, TableIcon, List } from 'lucide-react';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { StandingsTable } from '@/components/standings/StandingsTable';

export default function ViewerTournamentDetails() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('bracket');

  const { tournament, teams, matches, standings, loading, getRoundName } = useTournamentDetails(tournamentId || '');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?role=viewer');
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">البطولة غير موجودة</h2>
            <p className="text-muted-foreground mb-4">لم يتم العثور على البطولة المطلوبة</p>
            <Button onClick={() => navigate('/following')}>العودة للمتابعات</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'outline' | 'destructive' | 'default' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      upcoming: { label: 'قادمة', variant: 'outline' },
      live: { label: 'جارية', variant: 'destructive' },
      completed: { label: 'منتهية', variant: 'default' }
    };
    return config[status] || config.draft;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = { knockout: 'إقصائية', league: 'دوري', groups: 'مجموعات' };
    return config[type] || type;
  };

  const statusConfig = getStatusBadge(tournament.status);
  const showStandings = tournament.type === 'league' || tournament.type === 'groups';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ViewerHeader />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة
        </Button>

        <Card className="mb-8 overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-display font-bold">{tournament.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      <Badge variant="outline">{getTypeBadge(tournament.type)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">{teams?.length || 0}</p>
                    <p className="text-muted-foreground text-xs">فريق</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">{matches?.length || 0}</p>
                    <p className="text-muted-foreground text-xs">مباراة</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="bracket" className="flex items-center gap-2"><GitBranch className="w-4 h-4" />شجرة البطولة</TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2"><List className="w-4 h-4" />المباريات</TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2"><Users className="w-4 h-4" />الفرق</TabsTrigger>
            {showStandings && <TabsTrigger value="standings" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />الترتيب</TabsTrigger>}
          </TabsList>

          <TabsContent value="bracket">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" />شجرة البطولة</CardTitle></CardHeader>
              <CardContent><BracketView matches={matches || []} getRoundName={getRoundName} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><List className="w-5 h-5" />المباريات</CardTitle></CardHeader>
              <CardContent><MatchesList matches={matches || []} getRoundName={getRoundName} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />الفرق المشاركة</CardTitle></CardHeader>
              <CardContent>
                {teams && teams.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {teams.map((team) => (
                      <div key={team.id} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{team.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{team.name}</p>
                          {team.group_name && <p className="text-xs text-muted-foreground">المجموعة {team.group_name}</p>}
                        </div>
                        {team.is_eliminated && <Badge variant="destructive" className="text-xs">خرج</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد فرق مسجلة</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {showStandings && (
            <TabsContent value="standings">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TableIcon className="w-5 h-5" />جدول الترتيب</CardTitle></CardHeader>
                <CardContent>
                  {standings && standings.length > 0 ? (
                    <StandingsTable standings={standings.map((s, idx) => {
                      const team = teams?.find(t => t.id === s.team_id);
                      return {
                        position: s.position || idx + 1,
                        name: team?.name || 'غير معروف',
                        played: s.played || 0,
                        won: s.won || 0,
                        drawn: s.drawn || 0,
                        lost: s.lost || 0,
                        goalsFor: s.goals_for || 0,
                        goalsAgainst: s.goals_against || 0,
                        goalDifference: s.goal_difference || 0,
                        points: s.points || 0
                      };
                    })} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات ترتيب بعد</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
