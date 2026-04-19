import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { OrganizerAppSidebar } from '@/components/organizer/OrganizerAppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ORGANIZER_BASE } from '@/lib/constants';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === `${ORGANIZER_BASE}/dashboard`;
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!loading && !user) navigate(`${ORGANIZER_BASE}/auth?tab=login`);
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full sports-bg" dir={dir}>
        <OrganizerAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 border-b border-border glass-effect">
            <SidebarTrigger className="shrink-0" />
            <Link to={`${ORGANIZER_BASE}/dashboard`} className="flex items-center gap-2 group">
              <img src="/icon-512.png" alt="Bottola" className="w-8 h-8 rounded-xl shadow-sm" />
              <span className="font-display text-lg font-bold">Bottola</span>
              <span className="text-xs text-muted-foreground">{t('app.organizer')}</span>
            </Link>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
