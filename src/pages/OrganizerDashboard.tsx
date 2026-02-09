import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Search, Filter, Settings, Bell, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { PinLockScreen } from '@/components/organizer/PinLockScreen';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`${ORGANIZER_BASE}/auth?tab=login`);
      return;
    }
    // Check if user has PIN set
    if (user) {
      supabase
        .from('profiles')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setHasPin(!!data?.pin_hash);
          if (!data?.pin_hash) {
            setPinVerified(true); // No PIN set, skip verification
          }
        });
    }
  }, [user, authLoading, navigate]);

  // Filter only this organizer's tournaments
  const myTournaments = tournaments.filter(t => t.owner_id === user?.id);

  const filteredTournaments = myTournaments.filter((tournament) => {
    if (searchQuery && !tournament.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && tournament.status !== statusFilter) return false;
    if (typeFilter !== 'all' && tournament.type !== typeFilter) return false;
    return true;
  });

  if (authLoading || hasPin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hasPin && !pinVerified) {
    return <PinLockScreen userId={user!.id} onSuccess={() => setPinVerified(true)} />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate(`${ORGANIZER_BASE}`);
  };

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

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">{profile?.display_name || user?.email}</p>
                    <p className="text-xs text-muted-foreground">منظم بطولات</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`${ORGANIZER_BASE}/settings`)}>
                    <Settings className="ml-2 h-4 w-4" />
                    الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
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
              ابدأ بإنشاء بطولتك الأولى واستمتع بتجربة إدارة احترافية
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary text-primary-foreground rounded-xl font-semibold">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء بطولة
            </Button>
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && filteredTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${tournament.id}`)} className="cursor-pointer">
                <TournamentCard
                  id={tournament.id}
                  name={tournament.name}
                  teams={tournament.num_teams}
                  startDate={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                  status={tournament.status === 'draft' ? 'upcoming' : tournament.status}
                  type={tournament.type}
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
