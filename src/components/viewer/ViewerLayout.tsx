import { ReactNode } from 'react';
import { MobileShell } from '@/components/layout/MobileShell';

interface ViewerLayoutProps {
  children: ReactNode;
}

export function ViewerLayout({ children }: ViewerLayoutProps) {
  return <MobileShell variant="viewer">{children}</MobileShell>;
}
