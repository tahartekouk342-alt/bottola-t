import { ReactNode, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomTabBar } from './BottomTabBar';
import { ORGANIZER_BASE } from '@/lib/constants';

interface MobileShellProps {
  children: ReactNode;
  variant: 'viewer' | 'organizer';
  hideHeader?: boolean;
  hideTabBar?: boolean;
}

/**
 * Mobile-first app shell (iOS/Android style).
 * Replaces SidebarProvider — no sidebar.
 * Provides a slim top header with brand + a fixed bottom tab bar.
 */
export function MobileShell({ children, variant, hideHeader, hideTabBar }: MobileShellProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  // Organizer pages all ship their own custom headers
  const isOrganizer = variant === 'organizer';
  const isHome = location.pathname === '/home';
  const isTournamentDetail =
    location.pathname.startsWith('/viewer/tournament/') ||
    location.pathname.includes(`${ORGANIZER_BASE}/tournament/`);
  const showHeader = !hideHeader && !isOrganizer && !isHome && !isTournamentDetail;

  const homePath = variant === 'viewer' ? '/home' : `${ORGANIZER_BASE}/dashboard`;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {showHeader && (
        <header
          className="sticky top-0 z-40 h-14 flex items-center gap-2 px-4 bg-card/90 backdrop-blur-xl border-b border-border"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <Link to={homePath} className="flex items-center gap-2 group">
            <img src="/icon-512.png" alt="Bottola" className="w-9 h-9 rounded-2xl shadow-md shadow-primary/20" />
            <span className="font-display text-base font-black text-foreground tracking-tight">Bottola</span>
          </Link>
        </header>
      )}

      <main className={`flex-1 ${hideTabBar ? '' : 'pb-20'}`}>
        {children}
      </main>

      {!hideTabBar && <BottomTabBar variant={variant} />}
    </div>
  );
}
