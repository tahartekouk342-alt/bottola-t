import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, User as UserIcon, Calendar, Award, Bell, Loader2, TrendingUp, UserPlus, CalendarCheck, BarChart3 } from 'lucide-react';
import { PinLockScreen } from '@/components/organizer/PinLockScreen';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useNotifications } from '@/hooks/useNotifications';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const [pinVerified, setPinVerified] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('pin_hash').eq('user_id', user.id).single()
        .then(({ data }) => {
          setHasPin(!!data?.pin_hash);
          if (!data?.pin_hash) setPinVerified(true);
        });
    }
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ['org-stats', user?.id],
    queryFn: async () => {
      if (!user) return { active: 0, teams: 0, players: 0, completed: 0, upcoming: 0 };
      const [{ data: tournaments }, { count: followers }] = await Promise.all([
        supabase.from('tournaments').select('id, status, num_teams').eq('owner_id', user.id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      ]);
      const list = tournaments || [];
      const ids = list.map(t => t.id);
      const teamsTotal = list.reduce((s, t) => s + (t.num_teams || 0), 0);
      let upcomingMatches = 0;
      if (ids.length) {
        const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true })
          .in('tournament_id', ids).eq('status', 'scheduled');
        upcomingMatches = count || 0;
      }
      return {
        active: list.filter(t => ['active', 'live', 'upcoming'].includes(t.status as string)).length,
        teams: teamsTotal,
        players: followers || 0,
        completed: list.filter(t => t.status === 'completed').length,
        upcoming: upcomingMatches,
      };
    },
    enabled: !!user?.id,
  });

  if (authLoading || hasPin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (hasPin && !pinVerified) {
    return <PinLockScreen userId={user!.id} onSuccess={() => setPinVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="h-16 px-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <img src="/icon-512.png" alt="Bottola" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold text-foreground">Bottola Pro</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`${ORGANIZER_BASE}/notifications`)} className="relative w-10 h-10 flex items-center justify-center text-muted-foreground">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />}
          </button>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-5">
        {/* Welcome card */}
        <div className="relative h-[200px] rounded-xl overflow-hidden">
          <img src="/images/sport-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative p-4 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">مرحباً بك!</h2>
                <p className="text-white text-sm flex items-center gap-1">
                  <span>أنت منظم محترف</span>
                  <span className="inline-flex w-4 h-4 rounded-full bg-primary items-center justify-center text-[10px]">✓</span>
                </p>
                <p className="text-white/90 text-sm mt-1">إدارة بطولاتك بسهولة واحترافية</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-black/30 rounded-lg p-3">
              <Stat label="البطولات النشطة" value={stats?.active || 0} icon={Trophy} />
              <Stat label="الفرق" value={stats?.teams || 0} icon={Users} />
              <Stat label="المشاركون" value={stats?.players || 0} icon={UserIcon} />
            </div>
          </div>
        </div>

        {/* KPI grid 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={Trophy} value={stats?.active || 0} label="البطولات النشطة" />
          <Kpi icon={Calendar} value={stats?.upcoming || 0} label="المباريات القادمة" />
          <Kpi icon={Users} value={stats?.players || 0} label="إجمالي المشاركين" />
          <Kpi icon={Award} value={stats?.completed || 0} label="الفعاليات المكتملة" />
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center justify-end gap-2">
            <span>النشاط الأخير</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <ActivityRow icon={Trophy} title="تم إنشاء بطولة جديدة" subtitle="بطولة الشتاء لكرة القدم 2024" time="منذ 10 دقائق" />
            <ActivityRow icon={UserPlus} title="تم تسجيل فريق جديد" subtitle="فريق النجوم" time="منذ 35 دقيقة" />
            <ActivityRow icon={CalendarCheck} title="تم تأكيد مباراة جديدة" subtitle="فريق الأبطال ضد فريق القمة" time="منذ ساعة" />
            <ActivityRow icon={BarChart3} title="تم تحديث نتائج مباراة" subtitle="فريق الوحدة 2 - 1 فريق السلام" time="منذ 3 ساعات" last />
          </div>
          <button onClick={() => navigate(`${ORGANIZER_BASE}/notifications`)} className="w-full text-center text-sm text-primary font-semibold mt-3 py-2">
            عرض كل النشاط
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="text-center text-white">
      <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-[10px] opacity-90 mt-1">{label}</p>
    </div>
  );
}

function Kpi({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 h-[120px] flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <div className="w-8 h-0.5 bg-primary mt-2 rounded" />
    </div>
  );
}

function ActivityRow({ icon: Icon, title, subtitle, time, last }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 ${last ? '' : 'border-b border-border'}`}>
      <span className="text-xs text-muted-foreground shrink-0 w-16">{time}</span>
      <div className="flex-1 text-right">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}
