import { useState } from 'react';
import { Bell, Search, Filter, Users, MoreVertical, Edit, Eye, Trash2, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function OrganizerTeams() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: teams = [] } = useQuery({
    queryKey: ['org-teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: ts } = await supabase.from('tournaments').select('id, sport_type').eq('owner_id', user.id);
      const ids = (ts || []).map(t => t.id);
      if (!ids.length) return [];
      const sportMap = Object.fromEntries((ts || []).map(t => [t.id, (t as any).sport_type || 'football']));
      const { data: rows } = await supabase
        .from('teams')
        .select('id, name, logo_url, tournament_id, is_eliminated')
        .in('tournament_id', ids);
      const teamIds = (rows || []).map(t => t.id);
      let counts: Record<string, number> = {};
      if (teamIds.length) {
        const { data: pls } = await supabase.from('players').select('team_id').in('team_id', teamIds);
        (pls || []).forEach(p => { counts[p.team_id] = (counts[p.team_id] || 0) + 1; });
      }
      return (rows || []).map(t => ({ ...t, sport: sportMap[t.tournament_id], members: counts[t.id] || 0 }));
    },
    enabled: !!user?.id,
  });

  const filtered = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  const sportLabel = (s: string) => s === 'basketball' ? 'كرة سلة' : s === 'volleyball' ? 'كرة طائرة' : 'كرة قدم';
  const sportEmoji = (s: string) => s === 'basketball' ? '🏀' : s === 'volleyball' ? '🏐' : '⚽';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">إدارة الفرق والمشاركين</h1>
        <button className="relative w-10 h-10 flex items-center justify-center text-muted-foreground">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
        </button>
      </header>

      <div className="p-4 pb-28 space-y-3">
        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن فريق..."
              className="w-full h-11 pr-10 pl-3 rounded-lg bg-muted border border-border text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button className="h-11 px-4 rounded-lg border border-primary text-primary text-sm font-semibold flex items-center gap-1">
            <Filter className="w-4 h-4" /> تصفية
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['ترتيب', 'جميع الحالات', 'جميع الرياضات', 'الكل'].map((f, i) => (
            <button key={i} className="shrink-0 h-9 px-3 rounded-lg bg-muted border border-border text-xs">{f}</button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-3 bg-muted text-xs font-bold text-muted-foreground border-b border-border">
            <span>الفريق</span>
            <span>الرياضة</span>
            <span>الأعضاء</span>
            <span>الحالة</span>
            <span>الإجراءات</span>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">لا توجد فرق</div>
          )}
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-3 py-3 items-center border-b border-border last:border-0 ${i % 2 ? 'bg-muted/40' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {t.logo_url ? <img src={t.logo_url} alt="" className="w-full h-full object-cover" /> : '⚽'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground">فريق {sportLabel(t.sport)}</p>
                </div>
              </div>
              <span className="text-xs flex items-center gap-1">{sportEmoji(t.sport)}</span>
              <span className="text-xs flex items-center gap-1"><Users className="w-3 h-3" /> {t.members}</span>
              <span className={`text-[11px] px-2 py-1 rounded ${t.is_eliminated ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {t.is_eliminated ? 'غير نشط' : 'نشط'}
              </span>
              <button className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="fixed bottom-20 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 flex items-center gap-2">
        <Plus className="w-5 h-5" /> إضافة فريق
      </button>
    </div>
  );
}
