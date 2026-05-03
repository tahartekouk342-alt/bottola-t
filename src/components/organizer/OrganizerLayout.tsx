import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ORGANIZER_BASE } from '@/lib/constants';
import { MobileShell } from '@/components/layout/MobileShell';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate(`${ORGANIZER_BASE}/auth?tab=login`);
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <MobileShell variant="organizer">{children}</MobileShell>;
}
