import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Search, Calendar, Users, Eye, Settings as SettingsIcon, Bell, MoreVertical, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'نشطة', bg: 'bg-primary/10', text: 'text-primary' },
  live: { label: 'جارية', bg: 'bg-primary/10', text: 'text-primary' },
  upcoming: { label: 'مخططة', bg: 'bg-info/10', text: 'text-info' },
  draft: { label: 'مخططة', bg: 'bg-info/10', text: 'text-info' },
  completed: { label: 'مكتملة', bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function OrganizerTournamentsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const myTournaments = tournaments
    .filter(t => t.owner_id === user?.id)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">إدارة البطولات</h1>
        <button className="relative w-10 h-10 flex items-center justify-center text-muted-foreground">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
        </button>
      </header>

      <div className="p-4 pb-28 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن بطولة..."
            className="w-full h-11 pr-10 pl-3 rounded-lg bg-muted border border-border text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['الموسم', 'الرياضة', 'الحالة', 'المزيد من الفلاتر'].map((f, i) => (
            <button key={i} className="shrink-0 h-10 px-3 rounded-lg bg-muted border border-border text-xs text-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {f}
            </button>
          ))}
        </div>

        {loading && [1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)}

        {!loading && myTournaments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">لا توجد بطولات</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء بطولتك الأولى</p>
          </div>
        )}

        {!loading && myTournaments.map(t => {
          const st = STATUS_LABEL[t.status] || STATUS_LABEL.draft;
          const start = t.start_date ? new Date(t.start_date).toLocaleDateString('ar-EG') : '—';
          const end = (t as any).end_date ? new Date((t as any).end_date).toLocaleDateString('ar-EG') : '—';
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-40">
                <img src={t.venue_photos?.[0] || '/images/sport-hero.jpg'} alt={t.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <button className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-foreground">{t.name}</h3>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${st.bg} ${st.text}`}>
                  ● {st.label}
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                  <div className="flex flex-col items-center">
                    <Calendar className="w-4 h-4 mb-1" />
                    <span>{start}</span>
                    <span className="text-[10px]">تاريخ البداية</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Calendar className="w-4 h-4 mb-1" />
                    <span>{end}</span>
                    <span className="text-[10px]">تاريخ النهاية</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4 mb-1" />
                    <span className="font-bold text-foreground">{t.num_teams}</span>
                    <span className="text-[10px]">فريق</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${t.id}`)}
                    className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <SettingsIcon className="w-4 h-4" /> إدارة البطولة
                  </button>
                  <button
                    onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${t.id}`)}
                    className="flex-1 h-9 rounded-md border border-primary text-primary text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-20 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>بطولة جديدة</span>
      </button>

      <CreateTournamentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
