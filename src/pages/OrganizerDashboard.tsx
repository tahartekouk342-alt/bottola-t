import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinLockScreen } from '@/components/organizer/PinLockScreen';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
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

  const { data: followerCount } = useQuery({
    queryKey: ['follower-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user!.id);
      return count || 0;
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
    <div className="min-h-screen relative overflow-hidden bg-background" dir="rtl">
      <div className="relative h-56 overflow-hidden">
        <img src="/images/sport-hero.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
        <svg className="absolute bottom-0 left-0 w-full h-16" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,120 C360,0 1080,0 1440,120 L1440,120 L0,120 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="relative z-10 px-4 -mt-8 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <img src="/icon-512.png" alt="Bottola" className="w-16 h-16 rounded-2xl shadow-xl" />
          <div>
            <h1 className="font-display text-3xl font-black text-primary">Bottola</h1>
            <p className="text-sm text-muted-foreground">مرحباً {profile?.display_name || 'منظم'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <Trophy className="w-6 h-6 text-primary mb-3" />
            <p className="text-2xl font-black">بطولاتي</p>
            <p className="text-xs text-muted-foreground">إدارة البطولات والمباريات</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
            <Users className="w-6 h-6 text-primary mb-3" />
            <p className="text-2xl font-black">{followerCount || 0}</p>
            <p className="text-xs text-muted-foreground">متابع</p>
          </div>
        </div>

        <Button onClick={() => navigate(`${ORGANIZER_BASE}/tournaments`)} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg">
          <Trophy className="w-5 h-5 ml-2" /> عرض البطولات
        </Button>
        <Button onClick={() => navigate(`${ORGANIZER_BASE}/tournaments?create=1`)} variant="outline" className="w-full h-14 rounded-2xl font-bold text-base border-2 border-primary text-primary bg-card">
          <Plus className="w-5 h-5 ml-2" /> إنشاء بطولة جديدة
        </Button>
      </div>
    </div>
  );
}
