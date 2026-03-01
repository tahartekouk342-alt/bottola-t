import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizerSidebar } from '@/components/organizer/OrganizerSidebar';
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
      <header className="sticky top-0 z-50 glass-effect">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">منظم</span>
            </div>

            <OrganizerSidebar />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">بطولاتي</h1>
            <p className="text-muted-foreground">إدارة واستعراض جميع بطولاتك</p>
          </div>
          <Button
            className="gradient-primary text-primary-foreground glow-primary font-semibold rounded-xl"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5 ml-2" />
            إنشاء بطولة جديدة
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && myTournaments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">لا توجد بطولات</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              ابدأ بإنشاء بطولتك الأولى واستمتع بتجربة إدارة احترافية
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary text-primary-foreground rounded-xl font-semibold">
              <Plus className="w-4 h-4 ml-2" />
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
