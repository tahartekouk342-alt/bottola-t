import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Bell, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  {
    title: 'البطولات',
    icon: Trophy,
    path: '/tournaments-feed',
    image: '/images/sport-stadium.jpg',
    color: 'from-orange-500 to-amber-600',
    ring: 'ring-orange-500/60',
  },
  {
    title: 'المتابعات',
    icon: Users,
    path: '/following',
    image: '/images/sport-basketball.jpg',
    color: 'from-emerald-500 to-green-600',
    ring: 'ring-emerald-500/60',
  },
  {
    title: 'الإشعارات',
    icon: Bell,
    path: '/notifications',
    image: '/images/sport-football.jpg',
    color: 'from-blue-500 to-cyan-600',
    ring: 'ring-blue-500/60',
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    path: '/settings',
    image: '/images/sport-volleyball.jpg',
    color: 'from-slate-500 to-gray-600',
    ring: 'ring-slate-500/60',
  },
];

export default function ViewerHome() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?role=viewer');
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* Stadium background */}
      <div className="absolute inset-0">
        <img src="/images/sport-hero.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          <img src="/icon-512.png" alt="Bottola" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-2xl" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">Bottola</h1>
          <p className="text-white/60 mt-1 text-sm">تابع البطولات لحظة بلحظة</p>
        </div>

        {/* Circular cards grid */}
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
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
