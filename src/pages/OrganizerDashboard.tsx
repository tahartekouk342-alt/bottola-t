import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Loader2, Users, Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinLockScreen } from '@/components/organizer/PinLockScreen';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';

const menuItems = [
  {
    title: 'بطولاتي',
    icon: Trophy,
    path: 'tournaments',
    image: '/images/sport-stadium.jpg',
    color: 'from-orange-500 to-amber-600',
    ring: 'ring-orange-500/60',
  },
  {
    title: 'المتابعون',
    icon: Users,
    path: 'followers',
    image: '/images/sport-basketball.jpg',
    color: 'from-emerald-500 to-green-600',
    ring: 'ring-emerald-500/60',
  },
  {
    title: 'الإشعارات',
    icon: Bell,
    path: 'notifications',
    image: '/images/sport-football.jpg',
    color: 'from-blue-500 to-cyan-600',
    ring: 'ring-blue-500/60',
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    path: 'settings',
    image: '/images/sport-volleyball.jpg',
    color: 'from-slate-500 to-gray-600',
    ring: 'ring-slate-500/60',
  },
];

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

  // Get follower count
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
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Stadium background */}
      <div className="absolute inset-0">
        <img src="/images/sport-hero.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
        {/* Logo + Profile */}
        <div className="mb-10 text-center">
          <img src="/icon-512.png" alt="Bottola" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-2xl" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">Bottola</h1>
          <p className="text-white/60 mt-1 text-sm">مرحباً {profile?.display_name || 'منظم'}</p>
        </div>

        {/* Circular cards grid */}
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(`${ORGANIZER_BASE}/${item.path}`)}
                className="group flex flex-col items-center gap-3 focus:outline-none"
              >
                <div className={`relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden ring-[3px] ${item.ring} shadow-2xl transition-transform group-hover:scale-105 group-active:scale-95`}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.color} opacity-50`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <span className="text-white font-bold text-sm tracking-wide uppercase">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
