import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Star, ArrowLeft, Bell, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';

const sportsBgs = [
  '/images/sport-football.jpg',
  '/images/sport-basketball.jpg',
  '/images/sport-volleyball.jpg',
  '/images/sport-hero.jpg',
];

const features = [
  {
    title: 'متابعة البطولات',
    description: 'تابع أحدث البطولات والمباريات لحظة بلحظة',
    image: '/images/sport-football.jpg',
    icon: Trophy,
  },
  {
    title: 'المباريات',
    description: 'شاهد نتائج المباريات والجداول مباشرة',
    image: '/images/sport-basketball.jpg',
    icon: Star,
  },
  {
    title: 'ترتيب الفرق',
    description: 'استعرض ترتيب الفرق والإحصائيات المفصلة',
    image: '/images/sport-volleyball.jpg',
    icon: Users,
  },
  {
    title: 'إشعارات فورية',
    description: 'احصل على تنبيهات لحظية بنتائج المباريات',
    image: '/images/sport-stadium.jpg',
    icon: Bell,
  },
];

export default function ViewerWelcome() {
  const navigate = useNavigate();
  const [currentBg, setCurrentBg] = useState(0);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % sportsBgs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir="rtl">
      {/* Animated Sports Background */}
      {sportsBgs.map((bg, i) => (
        <div
          key={bg}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${bg})`,
            opacity: i === currentBg ? 0.15 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

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

      {/* Hero */}
      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-2xl mx-auto text-center mt-8 md:mt-16 mb-12">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            مرحباً بك أيها
            <br />
            <span className="text-gradient">المشاهد</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
            تابع المنظمين المفضلين، شاهد البطولات والمباريات، واحصل على إشعارات فورية
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
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

        {/* Feature Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                  <feature.icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-bold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Background dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {sportsBgs.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBg(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentBg ? 'bg-primary w-6' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
        © 2025 Bottola. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
