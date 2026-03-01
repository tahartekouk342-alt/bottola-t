import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Loader2, Settings, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { PinLockScreen } from '@/components/organizer/PinLockScreen';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`${ORGANIZER_BASE}/auth?tab=login`);
      return;
    }
    if (user) {
      supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setHasPin(!!data?.pin_hash);
          if (!data?.pin_hash) {
            setPinVerified(true);
          }
        });
    }
  }, [user, authLoading, navigate]);

  const myTournaments = tournaments.filter(t => t.owner_id === user?.id);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`${ORGANIZER_BASE}`);
  };

  if (authLoading || hasPin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasPin && !pinVerified) {
    return <PinLockScreen userId={user!.id} onSuccess={() => setPinVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-2xl font-bold text-foreground block">Bottola</span>
                <span className="text-xs text-accent-foreground">منظم</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl hover:bg-secondary/50"
                onClick={() => navigate(`${ORGANIZER_BASE}/notifications`)}
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl hover:bg-secondary/50"
                onClick={() => navigate(`${ORGANIZER_BASE}/settings`)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl hover:bg-destructive/20 text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">بطولاتي</h1>
            <p className="text-muted-foreground text-lg">إدارة واستعراض جميع بطولاتك</p>
          </div>
          <Button
            className="btn-primary text-lg px-8 w-full md:w-auto"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5 ml-2" />
            إنشاء بطولة جديدة
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && myTournaments.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-3xl font-display font-bold mb-4">لا توجد بطولات</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              ابدأ بإنشاء بطولتك الأولى واستمتع بتجربة إدارة احترافية
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="btn-primary text-lg px-8">
              <Plus className="w-5 h-5 ml-2" />
              إنشاء بطولة
            </Button>
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && myTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTournaments.map((tournament) => (
              <div key={tournament.id} onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`)} className="cursor-pointer">
                <TournamentCard
                  id={tournament.id}
                  name={tournament.name}
                  teams={tournament.num_teams}
                  startDate={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                  status={tournament.status === 'draft' ? 'upcoming' : tournament.status}
                  type={tournament.type}
                  logoUrl={tournament.logo_url}
                  venueName={tournament.venue_name}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateTournamentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
