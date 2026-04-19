import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Bell, Settings, LogIn, Newspaper } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ViewerHome() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const menuItems = [
    { title: t('nav.tournaments'), icon: Trophy, path: '/tournaments-feed', image: '/images/sport-stadium.jpg', color: 'from-orange-500 to-amber-600', ring: 'ring-orange-500/60' },
    { title: t('nav.news'), icon: Newspaper, path: '/news-feed', image: '/images/sport-football.jpg', color: 'from-purple-500 to-violet-600', ring: 'ring-purple-500/60' },
    ...(user ? [
      { title: t('nav.following'), icon: Users, path: '/following', image: '/images/sport-basketball.jpg', color: 'from-emerald-500 to-green-600', ring: 'ring-emerald-500/60' },
      { title: t('nav.notifications'), icon: Bell, path: '/notifications', image: '/images/sport-football.jpg', color: 'from-blue-500 to-cyan-600', ring: 'ring-blue-500/60' },
      { title: t('nav.settings'), icon: Settings, path: '/settings', image: '/images/sport-volleyball.jpg', color: 'from-slate-500 to-gray-600', ring: 'ring-slate-500/60' },
    ] : [
      { title: t('nav.startNow'), icon: LogIn, path: '/auth?role=viewer', image: '/images/sport-basketball.jpg', color: 'from-emerald-500 to-green-600', ring: 'ring-emerald-500/60' },
    ]),
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" dir={dir}>
      <div className="absolute inset-0">
        <img src="/images/sport-hero.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="mb-10 text-center">
          <img src="/icon-512.png" alt="Bottola" className="w-16 h-16 mx-auto mb-3 rounded-2xl shadow-2xl" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">Bottola</h1>
          <p className="text-white/60 mt-1 text-sm">{t('app.viewerSubtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="group flex flex-col items-center gap-3 focus:outline-none">
                <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden ring-[3px] ${item.ring} shadow-2xl transition-transform group-hover:scale-105 group-active:scale-95`}>
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.color} opacity-50`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-11 h-11 text-white drop-shadow-lg" />
                  </div>
                </div>
                <span className="text-white font-bold text-sm tracking-wide">{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
