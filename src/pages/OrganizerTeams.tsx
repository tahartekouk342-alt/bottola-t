import { useState } from 'react';
import { Search, Filter, Users, Edit, Trash2, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AddTeamDialog } from '@/components/tournament/AddTeamDialog';
import { TeamPlayersDialog } from '@/components/tournament/TeamPlayersDialog';

export default function OrganizerTeams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [playersTeam, setPlayersTeam] = useState<any>(null);

  const { data: teams = [] } = useQuery({
    queryKey: ['org-teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Teams owned by organizer OR teams belonging to organizer's tournaments
      const { data: ts } = await supabase.from('tournaments').select('id, sport_type').eq('owner_id', user.id);
      const ids = (ts || []).map(t => t.id);
      const sportMap = Object.fromEntries((ts || []).map(t => [t.id, (t as any).sport_type || 'football']));

      let query = supabase
        .from('teams')
        .select('id, name, nickname, logo_url, tournament_id, is_eliminated, sport_type, organizer_id');

      if (ids.length) {
        query = query.or(`organizer_id.eq.${user.id},tournament_id.in.(${ids.join(',')})`);
      } else {
        query = query.eq('organizer_id', user.id);
      }
      const { data: rows } = await query;
      const teamIds = (rows || []).map(t => t.id);
      const counts: Record<string, number> = {};
      if (teamIds.length) {
        const { data: pls } = await supabase.from('players').select('team_id').in('team_id', teamIds);
        (pls || []).forEach(p => { counts[p.team_id] = (counts[p.team_id] || 0) + 1; });
      }
      return (rows || []).map(t => ({
        ...t,
        sport: t.sport_type || sportMap[t.tournament_id!] || 'football',
        members: counts[t.id] || 0,
      }));
    },
    enabled: !!user?.id,
  });

  const filtered = teams.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  const sportLabel = (s: string) => s === 'basketball' ? 'كرة سلة' : s === 'volleyball' ? 'كرة طائرة' : 'كرة قدم';
  const sportEmoji = (s: string) => s === 'basketball' ? '🏀' : s === 'volleyball' ? '🏐' : '⚽';

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(t => t.id));
  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const bulkDelete = async () => {
    if (!selected.length) return;
    if (!confirm(`حذف ${selected.length} فرق؟ سيتم حذف لاعبيهم أيضاً.`)) return;
    await supabase.from('players').delete().in('team_id', selected);
    const { error } = await supabase.from('teams').delete().in('id', selected);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم الحذف ✅' });
    setSelected([]);
    qc.invalidateQueries({ queryKey: ['org-teams'] });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">إدارة الفرق</h1>
        <div className="w-10" />
      </header>

      <div className="p-4 pb-28 space-y-3">
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

        {selected.length > 0 && (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-2">
            <span className="text-sm font-semibold text-primary">تم اختيار {selected.length}</span>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 me-1" /> حذف
            </Button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-3 bg-muted text-xs font-bold text-muted-foreground border-b border-border">
            <Checkbox checked={filtered.length > 0 && selected.length === filtered.length} onCheckedChange={toggleAll} />
            <span className="flex-1">الفريق</span>
            <span className="w-10 text-center">الرياضة</span>
            <span className="w-12 text-center">الأعضاء</span>
            <span className="w-10 text-center">الحالة</span>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">لا توجد فرق — أضف فريقك الأول</div>
          )}
          {filtered.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 px-3 py-3 border-b border-border last:border-0 ${i % 2 ? 'bg-muted/40' : ''}`}>
              <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
              <button onClick={() => setPlayersTeam(t)} className="flex items-center gap-2 flex-1 min-w-0 text-right">
                <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {t.logo_url ? <img src={t.logo_url} alt="" className="w-full h-full object-cover" /> : '⚽'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.nickname || sportLabel(t.sport)}</p>
                </div>
              </button>
              <span className="text-base w-10 text-center">{sportEmoji(t.sport)}</span>
              <span className="text-xs w-12 text-center flex items-center justify-center gap-0.5"><Users className="w-3 h-3" /> {t.members}</span>
              <span className={`text-[11px] w-10 text-center px-1 py-1 rounded ${t.is_eliminated ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                {t.is_eliminated ? '✕' : '✓'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30 flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> إضافة فريق
      </button>

      <AddTeamDialog open={addOpen} onOpenChange={setAddOpen} />
      <TeamPlayersDialog open={!!playersTeam} onOpenChange={(o) => !o && setPlayersTeam(null)} team={playersTeam} />
    </div>
  );
}
