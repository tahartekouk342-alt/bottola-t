import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ViewerAppSidebar } from '@/components/viewer/ViewerAppSidebar';
import { Link } from 'react-router-dom';

interface ViewerLayoutProps {
  children: ReactNode;
}

export function ViewerLayout({ children }: ViewerLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" dir="rtl">
        <ViewerAppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-14 flex items-center gap-3 px-4 border-b border-border glass-effect">
            <SidebarTrigger className="shrink-0" />
            <Link to="/home" className="flex items-center gap-2 group">
              <img src="/icon-512.png" alt="Bottola" className="w-8 h-8 rounded-xl" />
              <span className="font-display text-lg font-bold">Bottola</span>
            </Link>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
