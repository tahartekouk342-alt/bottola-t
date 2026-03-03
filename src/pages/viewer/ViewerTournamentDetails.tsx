import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Calendar, Users, Loader2, GitBranch, TableIcon, List, UserPlus, Swords, MapPin, Plus, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { BracketView } from '@/components/tournament/BracketView';
import { MatchesList } from '@/components/tournament/MatchesList';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'matches', label: 'المباريات', icon: Swords },
  { id: 'teams', label: 'الفرق', icon: Users },
  { id: 'bracket', label: 'شجرة الإقصاء', icon: GitBranch },
  { id: 'standings', label: 'الترتيب', icon: TableIcon },
  { id: 'join', label: 'طلب انضمام', icon: UserPlus },
];

export default function ViewerTournamentDetails() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');

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

  const showStandings = tournament.type === 'league' || tournament.type === 'groups';
  const showJoin = tournament.accept_join_requests;

  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'standings' && !showStandings) return false;
    if (tab.id === 'join' && !showJoin) return false;
    return true;
  });

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
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Header with Stadium Image */}
      <div className="relative">
        <div className="relative h-56 md:h-72">
          <img
            src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'}
            alt={tournament.venue_name || 'ملعب'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />

          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 z-20 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm rounded-xl"
          >
            <ArrowRight className="w-4 h-4 ml-1" />رجوع
          </Button>

          {/* Tournament Info */}
          <div className="absolute bottom-4 right-4 left-4 z-10 flex items-end gap-3">
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
        </div>

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
          <div className="overflow-x-auto">
            <div className="flex min-w-max">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-5 py-3 text-xs font-bold border-b-[3px] transition-colors whitespace-nowrap flex-1',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'matches' && (
          <MatchesList matches={matches} getRoundName={getRoundName} />
        )}

        {activeTab === 'teams' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{team.name.charAt(0)}</span>
                  </div>
                )}
                <span className="font-bold text-sm truncate">{team.name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bracket' && (
          <BracketView matches={matches} getRoundName={getRoundName} />
        )}

        {activeTab === 'standings' && showStandings && (
          <StandingsTable standings={transformedStandings} />
        )}

        {activeTab === 'join' && showJoin && tournamentId && (
          <JoinRequestInline tournamentId={tournamentId} />
        )}
      </div>
    </div>
  );
}

/* Inline Join Request Form */
function JoinRequestInline({ tournamentId }: { tournamentId: string }) {
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
      toast({ title: 'أدخل اسم الفريق', variant: 'destructive' });
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
      toast({ title: 'تم إرسال الطلب بنجاح ✅' });
      setTeamName('');
      setPlayerNames([]);
    } catch {
      toast({ title: 'خطأ في الإرسال', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">طلب انضمام</h3>
            <p className="text-sm text-muted-foreground">أدخل بيانات فريقك للمشاركة في البطولة</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">اسم الفريق</label>
          <Input placeholder="مثال: نجوم الحي" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-bold mb-1.5 block">اللاعبون ({playerNames.length})</label>
          <div className="flex gap-2 mb-2">
            <Input placeholder="اسم اللاعب" value={newPlayer} onChange={(e) => setNewPlayer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()} className="flex-1" />
            <Button onClick={handleAddPlayer} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
          </div>
          {playerNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {playerNames.map((name, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {name}
                  <button onClick={() => setPlayerNames(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full gradient-primary text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
          إرسال الطلب
        </Button>
      </CardContent>
    </Card>
  );
}
