import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';

export default function OrganizerTournamentsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const myTournaments = tournaments.filter(t => t.owner_id === user?.id);

  return (
    <div className="p-4 lg:p-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">بطولاتي</h1>
          <p className="text-muted-foreground">إدارة واستعراض جميع بطولاتك</p>
        </div>
        <Button className="btn-primary w-full md:w-auto" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-5 h-5 ml-2" />إنشاء بطولة جديدة
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      )}

      {!loading && myTournaments.length === 0 && (
        <div className="text-center py-24">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">لا توجد بطولات</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">ابدأ بإنشاء بطولتك الأولى</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="btn-primary">
            <Plus className="w-5 h-5 ml-2" />إنشاء بطولة
          </Button>
        </div>
      )}

      {!loading && myTournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTournaments.map((tournament) => (
            <div key={tournament.id} onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`)} className="cursor-pointer">
              <TournamentCard
                id={tournament.id} name={tournament.name} teams={tournament.num_teams}
                startDate={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                status={tournament.status === 'draft' ? 'upcoming' : tournament.status}
                type={tournament.type} logoUrl={tournament.logo_url} venueName={tournament.venue_name}
              />
            </div>
          ))}
        </div>
      )}

      <CreateTournamentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
