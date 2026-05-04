import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Eye, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ViewerWelcome() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col" dir={dir}>
      {/* Top hero image with curved bottom */}
      <div className="relative w-full" style={{ height: '52vh', minHeight: 360 }}>
        <img
          src="/images/sport-hero.jpg"
          alt="Bottola"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        {/* Curved bottom mask */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ height: 80 }}
        >
          <path d="M0,120 C360,0 1080,0 1440,120 L1440,120 L0,120 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative flex-1 px-6 pb-10 -mt-4 flex flex-col items-center text-center">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <img src="/icon-512.png" alt="Bottola" className="w-14 h-14 rounded-2xl shadow-lg" />
          <span className="font-display text-4xl font-black text-primary tracking-tight">Bottola</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-tight mb-3 max-w-md">
          {t('welcome.viewerHi')} <span className="text-primary">{t('welcome.viewerLabel')}</span>
        </h1>
        <p className="text-base text-muted-foreground mb-10 max-w-sm">
          {t('welcome.viewerDesc')}
        </p>

        {/* CTA buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Primary: login — clearly visible */}
          <button
            onClick={() => navigate('/auth?role=viewer&tab=login')}
            className="group w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-between px-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <span className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </span>
            <span>{t('nav.login', 'تسجيل الدخول')}</span>
            <ChevronLeft className="w-5 h-5 opacity-90 rtl:rotate-0 ltr:rotate-180" />
          </button>

          {/* Secondary: create account */}
          <button
            onClick={() => navigate('/auth?role=viewer&tab=signup')}
            className="group w-full h-14 rounded-2xl border-2 border-primary text-primary font-bold text-base flex items-center justify-between px-5 bg-card hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </span>
            <span>{t('welcome.createFreeAccount')}</span>
            <ChevronLeft className="w-5 h-5 opacity-80 rtl:rotate-0 ltr:rotate-180" />
          </button>

          {/* Tertiary: guest browse */}
          <button
            onClick={() => navigate('/tournaments-feed')}
            className="group w-full h-12 rounded-2xl text-muted-foreground hover:text-primary font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{t('welcome.browseAsGuest', 'تصفح كضيف')}</span>
          </button>
        </div>
      </div>

      <footer className="text-center pb-4 text-xs text-muted-foreground">
        {t('welcome.rights')}
      </footer>
    </div>
  );
}
