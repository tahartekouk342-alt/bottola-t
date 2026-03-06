import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Shield, Clock, Image, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ORGANIZER_BASE } from '@/lib/constants';

const sportsBgs = [
  '/images/sport-hero.jpg',
  '/images/sport-stadium.jpg',
  '/images/sport-football.jpg',
  '/images/sport-basketball.jpg',
];

const features = [
  {
    title: 'إنشاء وتعديل البطولات',
    description: 'أنشئ بطولات بأنظمة مختلفة: إقصاء، مجموعات، مختلط',
    image: '/images/sport-stadium.jpg',
    icon: Trophy,
  },
  {
    title: 'رفع الشعار والصور',
    description: 'أضف شعار البطولة وصور الملعب لتجربة احترافية',
    image: '/images/sport-hero.jpg',
    icon: Image,
  },
  {
    title: 'تحديد الوقت والمكان',
    description: 'حدد مواعيد المباريات وأماكن اللعب بدقة',
    image: '/images/sport-football.jpg',
    icon: Clock,
  },
  {
    title: 'إدارة طلبات الانضمام',
    description: 'استقبل طلبات الفرق وراجعها قبل القبول',
    image: '/images/sport-basketball.jpg',
    icon: Users,
  },
];

export default function OrganizerWelcome() {
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
            if (data?.role === 'organizer') {
              navigate(`${ORGANIZER_BASE}/dashboard`);
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
            opacity: i === currentBg ? 0.12 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <Trophy className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
          <span className="text-xs bg-accent/20 text-accent-foreground px-3 py-1 rounded-full font-semibold">منظم</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-3xl mx-auto text-center mt-8 md:mt-12 mb-16">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            مرحباً بك أيها
            <br />
            <span className="text-gradient">المنظم</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            لوحة تحكم متقدمة لإنشاء وإدارة البطولات الرياضية باحترافية تامة
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="btn-primary text-lg px-12 w-full sm:w-auto"
              onClick={() => navigate(`${ORGANIZER_BASE}/auth`)}
            >
              إنشاء حساب منظم
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-12 w-full sm:w-auto rounded-2xl border-white/20 hover:bg-secondary/50"
              onClick={() => navigate(`${ORGANIZER_BASE}/auth?tab=login`)}
            >
              تسجيل الدخول
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="feature-card group"
              >
                <div className="feature-card-image">
                  <img
                    src={feature.image}
                    alt={feature.title}
                  />
                  <div className="feature-card-overlay" />
                  <div className="feature-card-icon">
                    <IconComponent className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Background dots indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {sportsBgs.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBg(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentBg ? 'bg-primary w-8 h-2' : 'bg-muted-foreground/30 w-2 h-2'
              }`}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground">
        © 2025 Bottola. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
