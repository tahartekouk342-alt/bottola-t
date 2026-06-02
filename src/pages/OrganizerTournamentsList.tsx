import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Search, Users, Settings as SettingsIcon, Edit, Eye, MoreVertical, Filter, Gavel, MapPin, Link2, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTournamentDialog } from '@/components/tournament/CreateTournamentDialog';
import { EditTournamentDialog } from '@/components/tournament/EditTournamentDialog';
import { useAuth } from '@/hooks/useAuth';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'نشطة', bg: 'bg-primary/10', text: 'text-primary' },
  live: { label: 'جارية', bg: 'bg-primary/10', text: 'text-primary' },
  upcoming: { label: 'مخططة', bg: 'bg-blue-100', text: 'text-blue-700' },
  draft: { label: 'مسودة', bg: 'bg-muted', text: 'text-muted-foreground' },
  completed: { label: 'مكتملة', bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function OrganizerTournamentsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTournament, setEditTournament] = useState<any>(null);
  const [search, setSearch] = useState('');

  const copyRegistrationLink = (token: string) => {
    const url = `${window.location.origin}/register/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'تم نسخ الرابط ✅', description: url });
  };

  const switchToManual = async (id: string) => {
    if (!confirm('التحويل إلى إدخال يدوي وإغلاق التسجيل المفتوح؟')) return;
    await supabase.from('tournaments').update({ registration_open: false, registration_mode: 'manual' } as any).eq('id', id);
    toast({ title: 'تم التحويل إلى الإدخال اليدوي ✅' });
    qc.invalidateQueries({ queryKey: ['tournaments'] });
    window.location.reload();
  };

  const myTournaments = tournaments
    .filter(t => t.owner_id === user?.id)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">إدارة البطولات</h1>
        <div className="w-10" />
      </header>

      <div className="p-4 pb-28 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن بطولة..."
            className="w-full h-11 pr-10 pl-3 rounded-lg bg-muted border border-border text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {['الكل', 'نشطة', 'مكتملة', 'مسودة'].map((f, i) => (
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
          return (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-40">
                <img src={t.venue_photos?.[0] || '/images/sport-hero.jpg'} alt={t.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <button
                  onClick={() => setEditTournament(t)}
                  className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow"
                  aria-label="تعديل البطولة"
                >
                  <Edit className="w-4 h-4 text-foreground" />
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
                  <InfoCell icon={Gavel} label="الحكم" value={t.referee_name || '—'} />
                  <InfoCell icon={MapPin} label="الملعب" value={t.venue_name || '—'} />
                  <InfoCell icon={Users} label="الفرق" value={String(t.num_teams)} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${t.id}`)}
                    className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <SettingsIcon className="w-4 h-4" /> إدارة
                  </button>
                  <button
                    onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${t.id}?view=info`)}
                    className="flex-1 h-9 rounded-md border border-primary text-primary text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> تفاصيل
                  </button>
                </div>

                {(t as any).registration_mode === 'open' && (t as any).registration_token && (
                  <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Link2 className="w-3.5 h-3.5" />
                      <span className="font-semibold">رابط التسجيل المفتوح</span>
                      {(t as any).registration_open ? (
                        <span className="ms-auto px-1.5 py-0.5 rounded bg-primary/10 text-[10px]">مفتوح</span>
                      ) : (
                        <span className="ms-auto px-1.5 py-0.5 rounded bg-muted text-[10px]">مغلق</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyRegistrationLink((t as any).registration_token)}
                        className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> نسخ الرابط
                      </button>
                      <button
                        onClick={() => switchToManual(t.id)}
                        className="h-8 px-2 rounded-md border border-border text-[11px] font-semibold flex items-center gap-1"
                        title="استيراد يدوي بدلاً من التسجيل المفتوح"
                      >
                        <Download className="w-3 h-3" /> يدوي
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-20 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>بطولة جديدة</span>
      </button>

      <CreateTournamentDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {editTournament && (
        <EditTournamentDialog
          tournament={editTournament}
          open={!!editTournament}
          onOpenChange={(o) => !o && setEditTournament(null)}
        />
      )}
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="w-4 h-4 mb-1" />
      <span className="font-bold text-foreground truncate max-w-full" title={value}>{value}</span>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}
