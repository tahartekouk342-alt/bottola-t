import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, List, CalendarDays, Trophy, ChevronLeft, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ORGANIZER_BASE } from '@/lib/constants';

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: 'مقررة', bg: 'bg-amber-50', text: 'text-amber-700' },
  live: { label: 'جارية', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { label: 'مكتملة', bg: 'bg-purple-50', text: 'text-purple-700' },
  postponed: { label: 'مؤجلة', bg: 'bg-muted', text: 'text-muted-foreground' },
};

export default function OrganizerMatches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const { data: matches = [] } = useQuery({
    queryKey: ['org-matches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: ts } = await supabase.from('tournaments').select('id, name').eq('owner_id', user.id);
      const ids = (ts || []).map(t => t.id);
      if (!ids.length) return [];
      const tMap = Object.fromEntries((ts || []).map(t => [t.id, t.name]));
      const { data: ms } = await supabase
        .from('matches')
        .select('id, tournament_id, home_team_id, away_team_id, match_date, match_time, status, round')
        .in('tournament_id', ids)
        .order('match_date', { ascending: true })
        .limit(50);
      const teamIds = Array.from(new Set((ms || []).flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean) as string[]));
      const { data: teams } = teamIds.length
        ? await supabase.from('teams').select('id, name, logo_url').in('id', teamIds)
        : { data: [] };
      const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]));
      return (ms || []).map(m => ({ ...m, tournamentName: tMap[m.tournament_id], home: teamMap[m.home_team_id!], away: teamMap[m.away_team_id!] }));
    },
    enabled: !!user?.id,
  });

  // group by date
  const groups: Record<string, typeof matches> = {};
  matches.forEach(m => {
    const d = m.match_date ? new Date(m.match_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'بدون تاريخ';
    (groups[d] ||= []).push(m);
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30">
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">جدولة المباريات</h1>
        <div className="flex items-center gap-2">
          <button className="relative w-10 h-10 flex items-center justify-center text-muted-foreground">
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
          </button>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">⚽</div>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-3">
        {/* Toggle */}
        <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setView('calendar')}
            className={`h-10 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
          >
            <CalendarDays className="w-4 h-4" /> التقويم
          </button>
          <button
            onClick={() => setView('list')}
            className={`h-10 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}
          >
            <List className="w-4 h-4" /> القائمة
          </button>
        </div>

        {Object.entries(groups).length === 0 && (
          <div className="text-center py-16 text-muted-foreground">لا توجد مباريات بعد</div>
        )}

        {Object.entries(groups).map(([date, list]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">{list.length} مباريات</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                {date} <CalendarDays className="w-4 h-4" />
              </span>
            </div>
            {list.map(m => {
              const st = STATUS[m.status] || STATUS.scheduled;
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <span className="flex-1 truncate">{m.tournamentName}</span>
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-muted overflow-hidden flex items-center justify-center mb-1">
                        {m.home?.logo_url ? <img src={m.home.logo_url} alt="" className="w-full h-full object-cover" /> : '⚽'}
                      </div>
                      <p className="text-sm font-semibold">{m.home?.name || '?'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{m.match_time || '—'}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-muted overflow-hidden flex items-center justify-center mb-1">
                        {m.away?.logo_url ? <img src={m.away.logo_url} alt="" className="w-full h-full object-cover" /> : '⚽'}
                      </div>
                      <p className="text-sm font-semibold">{m.away?.name || '?'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-3">
                    <span>الجولة {m.round}</span>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <button
                    onClick={() => navigate(`${ORGANIZER_BASE}/tournament/${m.tournament_id}`)}
                    className="w-full mt-3 h-9 rounded-md border border-primary text-primary text-sm font-semibold flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> عرض التفاصيل
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}
        className="fixed bottom-20 left-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
