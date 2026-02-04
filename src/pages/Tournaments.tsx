import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, Trophy } from 'lucide-react';
import { useTournaments } from '@/hooks/useTournaments';

const TournamentsPage = () => {
  const navigate = useNavigate();
  const { tournaments, loading } = useTournaments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      // Search filter
      if (searchQuery && !tournament.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && tournament.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && tournament.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [tournaments, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                البطولات
              </h1>
              <p className="text-muted-foreground">إدارة واستعراض جميع البطولات</p>
            </div>
            <Button 
              className="gradient-primary text-primary-foreground glow-primary font-semibold rounded-xl"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-5 h-5 ml-2" />
              إنشاء بطولة جديدة
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 rounded-2xl bg-card/50 border border-border/50">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="البحث عن بطولة..."
                className="pr-10 rounded-xl border-border/50 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl border-border/50 bg-background">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="upcoming">قريباً</SelectItem>
                <SelectItem value="live">جارية</SelectItem>
                <SelectItem value="completed">منتهية</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl border-border/50 bg-background">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="knockout">خروج المغلوب</SelectItem>
                <SelectItem value="league">دوري</SelectItem>
                <SelectItem value="groups">مجموعات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTournaments.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">لا توجد بطولات</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {tournaments.length === 0
                  ? 'ابدأ بإنشاء بطولتك الأولى واستمتع بتجربة إدارة احترافية'
                  : 'لا توجد نتائج تطابق البحث، جرب تغيير معايير البحث'}
              </p>
              {tournaments.length === 0 && (
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="gradient-primary text-primary-foreground rounded-xl font-semibold"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء بطولة
                </Button>
              )}
            </div>
          )}

          {/* Tournaments Grid */}
          {!loading && filteredTournaments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  className="cursor-pointer"
                >
                  <TournamentCard
                    id={tournament.id}
                    name={tournament.name}
                    teams={tournament.num_teams}
                    startDate={tournament.start_date 
                      ? new Date(tournament.start_date).toLocaleDateString('ar-SA')
                      : 'غير محدد'}
                    status={tournament.status === 'draft' ? 'upcoming' : tournament.status}
                    type={tournament.type}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Tournament Dialog */}
      <CreateTournamentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
};

export default TournamentsPage;
