import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Trophy, CalendarDays, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORGANIZER_BASE } from '@/lib/constants';

interface TabItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  match: (pathname: string) => boolean;
}

interface BottomTabBarProps {
  variant?: 'organizer';
}

export function BottomTabBar({}: BottomTabBarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs: TabItem[] = [
    { label: 'الرئيسية', icon: LayoutDashboard, path: `${ORGANIZER_BASE}/dashboard`, match: (p) => p === `${ORGANIZER_BASE}/dashboard` || p === ORGANIZER_BASE },
    { label: 'البطولات', icon: Trophy, path: `${ORGANIZER_BASE}/tournaments`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/tournaments`) || p.includes(`${ORGANIZER_BASE}/tournament/`) },
    { label: 'المباريات', icon: CalendarDays, path: `${ORGANIZER_BASE}/matches`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/matches`) },
    { label: 'الفرق', icon: Users, path: `${ORGANIZER_BASE}/teams`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/teams`) },
    { label: 'الإعدادات', icon: Settings, path: `${ORGANIZER_BASE}/settings`, match: (p) => p.startsWith(`${ORGANIZER_BASE}/settings`) },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border"
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
                'relative flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {active && <span className="absolute top-0 left-2 right-2 h-[3px] rounded-full bg-primary" />}
              <Icon className="w-6 h-6" strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn('text-[10px] leading-none', active ? 'font-bold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
