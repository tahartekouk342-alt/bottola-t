import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Calendar, Users, Loader2, GitBranch, TableIcon, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { StandingsTable } from '@/components/standings/StandingsTable';

export default function ViewerTournamentDetails() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bracket');

  const { tournament, teams, matches, standings, loading, getRoundName } = useTournamentDetails(tournamentId || '');

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">البطولة غير موجودة</h2>
            <Button onClick={() => navigate('/home')}>العودة</Button>
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

  // Transform standings for StandingsTable component
  const transformedStandings = standings.map((s, i) => {
    const team = teams.find(t => t.id === s.team_id);
    return {
      position: s.position || i + 1,
      name: team?.name || 'غير معروف',
      played: s.played || 0,
      won: s.won || 0,
      drawn: s.drawn || 0,
      lost: s.lost || 0,
      goalsFor: s.goals_for || 0,
      goalsAgainst: s.goals_against || 0,
      goalDifference: s.goal_difference || 0,
      points: s.points || 0,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
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
                    <Badge variant="secondary">{getTypeBadge(tournament.type)}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{teams.length} فريق</span></div>
              {tournament.start_date && (
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(tournament.start_date).toLocaleDateString('ar-SA')}</span></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full max-w-lg mb-6 ${showStandings ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="bracket" className="flex items-center gap-2"><GitBranch className="w-4 h-4" />الشجرة</TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2"><List className="w-4 h-4" />المباريات</TabsTrigger>
          {showStandings && <TabsTrigger value="standings" className="flex items-center gap-2"><TableIcon className="w-4 h-4" />الترتيب</TabsTrigger>}
        </TabsList>

        <TabsContent value="bracket">
          <BracketView matches={matches} getRoundName={getRoundName} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchesList matches={matches} />
        </TabsContent>
        {showStandings && (
          <TabsContent value="standings">
            <StandingsTable standings={transformedStandings} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
