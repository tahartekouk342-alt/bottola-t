import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomTabBar } from './BottomTabBar';

interface MobileShellProps {
  children: ReactNode;
  variant?: 'organizer';
  hideTabBar?: boolean;
}

/**
 * Mobile-first organizer shell.
 */
export function MobileShell({ children, hideTabBar }: MobileShellProps) {
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      <main className={`flex-1 ${hideTabBar ? '' : 'pb-20'}`}>
        {children}
      </main>
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
