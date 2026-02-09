import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Star, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';

export default function ViewerWelcome() {
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
            if (data?.role === 'viewer') {
              navigate('/following');
            }
          });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 gradient-hero" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">تابع بطولاتك المفضلة</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in-up">
            مرحباً بك في
            <br />
            <span className="text-gradient">Bottola</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed animate-fade-in-up">
            تابع المنظمين المفضلين لديك، شاهد البطولات والمباريات مباشرة، واحصل على إشعارات فورية بالنتائج
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-in-up">
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50">
              <Users className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">تابع المنظمين</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">شاهد البطولات</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card/50 border border-border/50">
              <Star className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">إشعارات فورية</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Button
              size="lg"
              className="gradient-primary text-primary-foreground glow-primary text-lg px-10 rounded-xl font-semibold w-full sm:w-auto"
              onClick={() => navigate('/auth?role=viewer')}
            >
              إنشاء حساب مجاني
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 rounded-xl font-semibold w-full sm:w-auto"
              onClick={() => navigate('/auth?role=viewer&tab=login')}
            >
              تسجيل الدخول
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
        © 2024 Bottola. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
