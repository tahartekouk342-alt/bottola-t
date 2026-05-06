import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight, Trophy, Users, Trash2, Plus, X, MapPin, Gavel, Calendar, Clock, Sparkles, Loader2,
} from 'lucide-react';
import { useTournamentDetails } from '@/hooks/useTournamentDetails';
import { useTournaments } from '@/hooks/useTournaments';
import { ORGANIZER_BASE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const view = searchParams.get('view') || 'manage';
  const {
    tournament, teams, matches, loading, fetchTournamentDetails,
  } = useTournamentDetails(id);
  const { deleteTournament, addTeams } = useTournaments();

  const [showAddTeams, setShowAddTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [savingTeams, setSavingTeams] = useState(false);

  // Inline edit fields for venue & referee (organizer can fill these later)
  const [editingMeta, setEditingMeta] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [refereeName, setRefereeName] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  // Schedule generator inputs
  const [schedDate, setSchedDate] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('22:00');
  const [matchDuration, setMatchDuration] = useState(90);
  const [restMinutes, setRestMinutes] = useState(60);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);

  const startEditMeta = () => {
    setVenueName(tournament?.venue_name || '');
    setVenueAddress(tournament?.venue_address || '');
    setRefereeName(tournament?.referee_name || '');
    setEditingMeta(true);
  };

  const saveMeta = async () => {
    if (!id) return;
    setSavingMeta(true);
    try {
      await supabase.from('tournaments').update({
        venue_name: venueName || null,
        venue_address: venueAddress || null,
        referee_name: refereeName || null,
      }).eq('id', id);
      toast({ title: 'تم الحفظ ✅' });
      setEditingMeta(false);
      fetchTournamentDetails();
    } catch (e: any) {
      toast({ title: 'خطأ', variant: 'destructive', description: e.message });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm('هل أنت متأكد من حذف البطولة؟')) {
      const ok = await deleteTournament(id);
      if (ok) navigate(`${ORGANIZER_BASE}/tournaments`);
    }
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && !teamsList.includes(newTeamName.trim())) {
      setTeamsList(prev => [...prev, newTeamName.trim()]);
      setNewTeamName('');
    }
  };

  const handleSaveTeams = async () => {
    if (!id || teamsList.length < 1) return;
    setSavingTeams(true);
    try {
      await addTeams(id, teamsList);
      toast({ title: 'تمت إضافة الفرق ✅' });
      setTeamsList([]);
      setShowAddTeams(false);
      fetchTournamentDetails();
    } catch (e: any) {
      toast({ title: 'خطأ', variant: 'destructive', description: e.message });
    } finally {
      setSavingTeams(false);
    }
  };

  // Smart schedule: assign date/time per match, ensuring REST minutes between
  // consecutive matches of the same team. Spread across multiple days as needed.
  const handleGenerateSchedule = async () => {
    if (!id || matches.length === 0) {
      toast({ title: 'لا توجد مباريات للجدولة', variant: 'destructive' });
      return;
    }
    if (!schedDate) {
      toast({ title: 'حدّد تاريخ بداية الجدولة', variant: 'destructive' });
      return;
    }
    setGeneratingSchedule(true);
    try {
      const sorted = [...matches].sort((a, b) => (a.round - b.round) || (a.match_order - b.match_order));
      const baseDate = new Date(schedDate + 'T00:00:00');
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const dayStartMin = sH * 60 + sM;
      const dayEndMin = eH * 60 + eM;
      const slotMin = matchDuration + restMinutes;

      const teamLastTime: Record<string, number> = {}; // absolute minute since epoch-day
      let dayOffset = 0;
      let cursorMin = dayStartMin;
      const updates: Array<{ id: string; date: string; time: string }> = [];

      for (const m of sorted) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 60) {
          attempts++;
          const absMin = dayOffset * 24 * 60 + cursorMin;
          const homeOk = !m.home_team_id || (absMin - (teamLastTime[m.home_team_id] ?? -Infinity)) >= (matchDuration + restMinutes);
          const awayOk = !m.away_team_id || (absMin - (teamLastTime[m.away_team_id] ?? -Infinity)) >= (matchDuration + restMinutes);
          const fitsDay = cursorMin + matchDuration <= dayEndMin;

          if (fitsDay && homeOk && awayOk) {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + dayOffset);
            const hh = String(Math.floor(cursorMin / 60)).padStart(2, '0');
            const mm = String(cursorMin % 60).padStart(2, '0');
            updates.push({ id: m.id, date: d.toISOString().slice(0, 10), time: `${hh}:${mm}` });
            if (m.home_team_id) teamLastTime[m.home_team_id] = absMin;
            if (m.away_team_id) teamLastTime[m.away_team_id] = absMin;
            cursorMin += slotMin;
            placed = true;
          } else if (!fitsDay) {
            dayOffset++;
            cursorMin = dayStartMin;
          } else {
            // team conflict — push slot forward
            cursorMin += slotMin;
            if (cursorMin + matchDuration > dayEndMin) {
              dayOffset++;
              cursorMin = dayStartMin;
            }
          }
        }
      }

      // batch update
      for (const u of updates) {
        await supabase.from('matches').update({
          match_date: new Date(u.date + 'T' + u.time + ':00').toISOString(),
          match_time: u.time,
        }).eq('id', u.id);
      }
      toast({ title: 'تم توزيع الأوقات ✅', description: `${updates.length} مباراة تم جدولتها` });
      fetchTournamentDetails();
    } catch (e: any) {
      toast({ title: 'خطأ', variant: 'destructive', description: e.message });
    } finally {
      setGeneratingSchedule(false);
    }
  };

  if (loading) {
    return <div className="p-8"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-96" /></div>;
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">البطولة غير موجودة</h1>
        <Button onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}>
          <ArrowRight className="w-4 h-4 ml-2" />العودة
        </Button>
      </div>
    );
  }

  // Info-only view (from "تفاصيل" button)
  if (view === 'info') {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="relative h-48">
          <img src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
          <Button size="sm" onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}
            className="absolute top-3 right-3 bg-black/40 text-white backdrop-blur">
            <ArrowRight className="w-4 h-4 ml-1" />رجوع
          </Button>
        </div>
        <div className="p-4 space-y-4 -mt-10 relative">
          <Card>
            <CardContent className="p-5 space-y-3">
              <h1 className="text-2xl font-bold">{tournament.name}</h1>
              <InfoRow icon={MapPin} label="الملعب" value={tournament.venue_name || '—'} />
              <InfoRow icon={MapPin} label="العنوان" value={tournament.venue_address || '—'} />
              <InfoRow icon={Gavel} label="الحكم" value={tournament.referee_name || '—'} />
              <InfoRow icon={Users} label="عدد الفرق" value={String(tournament.num_teams)} />
              <InfoRow icon={Calendar} label="تاريخ البداية" value={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('ar-EG') : '—'} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Manage view: show only Teams + Schedule generator + meta editor
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="relative h-44">
        <img src={tournament.venue_photos?.[0] || '/images/sport-stadium.jpg'} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-background" />
        <Button size="sm" onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)}
          className="absolute top-3 right-3 bg-black/40 text-white backdrop-blur">
          <ArrowRight className="w-4 h-4 ml-1" />رجوع
        </Button>
        <Button size="sm" variant="destructive" onClick={handleDelete}
          className="absolute top-3 left-3"><Trash2 className="w-4 h-4" /></Button>
        <div className="absolute bottom-3 right-4 left-4 text-white">
          <h1 className="text-xl font-bold drop-shadow">{tournament.name}</h1>
          <p className="text-sm opacity-90">{teams.length} فريق · {matches.length} مباراة</p>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-4">
        {/* Meta editor (venue / referee) */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> الملعب والحكم</h3>
              {!editingMeta && <Button size="sm" variant="outline" onClick={startEditMeta}>تعديل</Button>}
            </div>
            {editingMeta ? (
              <div className="space-y-2">
                <Input placeholder="اسم الملعب" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                <Input placeholder="عنوان الملعب" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
                <Input placeholder="اسم الحكم" value={refereeName} onChange={(e) => setRefereeName(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingMeta(false)} className="flex-1">إلغاء</Button>
                  <Button size="sm" onClick={saveMeta} disabled={savingMeta} className="flex-1 bg-primary text-primary-foreground">حفظ</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>الملعب: <span className="text-foreground font-medium">{tournament.venue_name || '—'}</span></div>
                <div>العنوان: <span className="text-foreground font-medium">{tournament.venue_address || '—'}</span></div>
                <div>الحكم: <span className="text-foreground font-medium">{tournament.referee_name || '—'}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teams ONLY (per request: remove matches/standings/bracket from this page) */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> الفرق ({teams.length})</h3>
              <Button size="sm" onClick={() => setShowAddTeams(v => !v)} variant="outline">
                <Plus className="w-4 h-4 ms-1" /> إضافة فرق
              </Button>
            </div>

            {showAddTeams && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex gap-2">
                  <Input placeholder="اسم الفريق" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()} />
                  <Button onClick={handleAddTeam} variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                {teamsList.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {teamsList.map((tn, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-card border text-sm">
                        <span className="truncate">{tn}</span>
                        <button onClick={() => setTeamsList(p => p.filter((_, j) => j !== i))} className="text-destructive">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={handleSaveTeams} disabled={savingTeams || teamsList.length < 1} className="w-full bg-primary text-primary-foreground">
                  حفظ الفرق
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {teams.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-6">لا توجد فرق بعد</p>}
              {teams.map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl border bg-card">
                  <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {t.logo_url ? <img src={t.logo_url} alt="" className="w-full h-full object-cover" /> : '⚽'}
                  </div>
                  <span className="text-sm font-medium truncate">{t.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI-style Smart Scheduler */}
        {matches.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> توزيع أوقات المباريات تلقائياً
              </h3>
              <p className="text-xs text-muted-foreground">
                يُوزّع أوقات {matches.length} مباراة مع ضمان فترة راحة بين مباريات الفريق نفسه.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">تاريخ البداية</Label>
                  <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">مدة المباراة (دقيقة)</Label>
                  <Input type="number" value={matchDuration} onChange={(e) => setMatchDuration(parseInt(e.target.value) || 90)} />
                </div>
                <div>
                  <Label className="text-xs">من الساعة</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">إلى الساعة</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">راحة بين مباريات نفس الفريق (دقيقة)</Label>
                  <Input type="number" value={restMinutes} onChange={(e) => setRestMinutes(parseInt(e.target.value) || 60)} />
                </div>
              </div>
              <Button onClick={handleGenerateSchedule} disabled={generatingSchedule}
                className="w-full bg-primary text-primary-foreground">
                {generatingSchedule ? <Loader2 className="w-4 h-4 animate-spin ms-2" /> : <Clock className="w-4 h-4 ms-2" />}
                توزيع الأوقات تلقائياً
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
