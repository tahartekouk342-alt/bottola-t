import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { ViewerSidebar } from '@/components/viewer/ViewerSidebar';
import { useAuth } from '@/hooks/useAuth';

interface ViewerLayoutProps {
  children: ReactNode;
}

export function ViewerLayout({ children }: ViewerLayoutProps) {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col w-full" dir="rtl">
      <ViewerHeader sidebar={<ViewerSidebar />} />
      <main className="flex-1 overflow-auto pt-16">{children}</main>
    </div>
  );
}
