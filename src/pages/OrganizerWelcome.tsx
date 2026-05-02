import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

export default function OrganizerWelcome() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.role === 'organizer') {
              navigate(`${ORGANIZER_BASE}/dashboard`);
            }
          });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col" dir="rtl">
      {/* Top hero image with curved bottom */}
      <div className="relative w-full" style={{ height: '52vh', minHeight: 360 }}>
        <img
          src="/images/sport-stadium.jpg"
          alt="Bottola"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-background" />
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ height: 80 }}
        >
          <path d="M0,120 C360,0 1080,0 1440,120 L1440,120 L0,120 Z" fill="hsl(var(--background))" />
        </svg>
      </div>

      <div className="relative flex-1 px-6 pb-10 -mt-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-display font-black text-3xl leading-none">B</span>
          </div>
          <span className="font-display text-4xl font-black text-primary tracking-tight">Bottola</span>
          <span className="text-xs bg-accent/20 text-accent-foreground px-3 py-1 rounded-full font-bold">منظم</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-tight mb-3 max-w-md">
          مرحباً بك أيها <span className="text-primary">المنظم</span>
        </h1>
        <p className="text-base text-muted-foreground mb-10 max-w-sm">
          لوحة تحكم احترافية لإنشاء وإدارة البطولات الرياضية
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => navigate(`${ORGANIZER_BASE}/auth`)}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-between px-5 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <span className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </span>
            <span>إنشاء حساب منظم</span>
            <ChevronLeft className="w-5 h-5 opacity-80" />
          </button>

          <button
            onClick={() => navigate(`${ORGANIZER_BASE}/auth?tab=login`)}
            className="w-full h-14 rounded-2xl border-2 border-primary text-primary font-bold text-base flex items-center justify-between px-5 bg-card hover:bg-primary/5 transition-all active:scale-[0.98]"
          >
            <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-5 h-5" />
            </span>
            <span>تسجيل الدخول</span>
            <ChevronLeft className="w-5 h-5 opacity-80" />
          </button>
        </div>
      </div>

      <footer className="text-center pb-4 text-xs text-muted-foreground">
        © 2025 Bottola. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
