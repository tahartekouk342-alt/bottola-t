import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Trophy, Newspaper, Bell, Settings, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { ORGANIZER_BASE } from '@/lib/constants';

interface TabItem {
  label: string;
  icon: typeof Home;
  path: string;
  match: (pathname: string) => boolean;
  badge?: number;
}

interface BottomTabBarProps {
  variant: 'viewer' | 'organizer';
}

export function BottomTabBar({ variant }: BottomTabBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const viewerTabs: TabItem[] = [
    { label: t('nav.home'), icon: Home, path: '/home', match: (p) => p === '/home' || p === '/' },
    { label: t('nav.tournaments'), icon: Trophy, path: '/tournaments-feed', match: (p) => p.startsWith('/tournaments-feed') || p.startsWith('/viewer/tournament') || p.startsWith('/viewer/organizer') },
    { label: t('nav.newsFeed'), icon: Newspaper, path: '/news-feed', match: (p) => p.startsWith('/news-feed') },
    { label: t('nav.notifications'), icon: Bell, path: '/notifications', match: (p) => p.startsWith('/notifications'), badge: unreadCount },
    { label: t('nav.settings'), icon: Settings, path: '/settings', match: (p) => p.startsWith('/settings') || p.startsWith('/following') },
  ];

  const organizerTabs: TabItem[] = [
    { label: t('nav.home'), icon: LayoutDashboard, path: `${ORGANIZER_BASE}/dashboard`, match: (p) => p === `${ORGANIZER_BASE}/dashboard` || p === ORGANIZER_BASE },
    { label: t('nav.myTournaments'), icon: Trophy, path: `${ORGANIZER_BASE}/tournaments`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/tournaments`) || p.includes(`${ORGANIZER_BASE}/tournament/`) },
    { label: t('nav.news'), icon: Newspaper, path: `${ORGANIZER_BASE}/news`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/news`) },
    { label: t('nav.followers'), icon: Users, path: `${ORGANIZER_BASE}/followers`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/followers`) },
    { label: t('nav.settings'), icon: Settings, path: `${ORGANIZER_BASE}/settings`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/settings`) },
  ];

  const tabs = variant === 'viewer' ? viewerTabs : organizerTabs;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="bottom navigation"
    >
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative w-11 h-7 rounded-full flex items-center justify-center transition-all',
                active && 'bg-primary/12'
              )}>
                <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} strokeWidth={active ? 2.4 : 1.8} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={cn('text-[10px] leading-none truncate max-w-full', active ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
