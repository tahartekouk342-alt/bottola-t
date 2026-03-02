import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ViewerAppSidebar } from '@/components/viewer/ViewerAppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ViewerLayoutProps {
  children: ReactNode;
}

export function ViewerLayout({ children }: ViewerLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth?role=viewer');
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <ViewerAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 border-b border-border glass-effect">
            <SidebarTrigger className="shrink-0" />
            <Link to="/home" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Bottola</span>
            </Link>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
