import { Header } from '@/components/layout/Header';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { MatchCard } from '@/components/match/MatchCard';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Target, Plus, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '@/assets/hero-bg.jpg';

// Sample data
const tournaments = [
  {
    id: '1',
    name: 'بطولة الأبطال 2024',
    teams: 16,
    startDate: '15 فبراير 2024',
    status: 'live' as const,
    type: 'knockout' as const,
  },
  {
    id: '2',
    name: 'دوري الأصدقاء',
    teams: 8,
    startDate: '1 مارس 2024',
    status: 'upcoming' as const,
    type: 'league' as const,
  },
  {
    id: '3',
    name: 'كأس الحي',
    teams: 12,
    startDate: '10 يناير 2024',
    status: 'completed' as const,
    type: 'groups' as const,
  },
];

const matches = [
  {
    homeTeam: { name: 'النجوم', score: 2 },
    awayTeam: { name: 'الصقور', score: 1 },
    date: '15 فبراير 2024',
    time: '18:00',
    status: 'live' as const,
    matchday: 'نصف النهائي',
  },
  {
    homeTeam: { name: 'الأسود' },
    awayTeam: { name: 'النمور' },
    date: '16 فبراير 2024',
    time: '20:00',
    status: 'upcoming' as const,
    matchday: 'نصف النهائي',
  },
  {
    homeTeam: { name: 'العقبان', score: 3 },
    awayTeam: { name: 'الذئاب', score: 0 },
    date: '14 فبراير 2024',
    time: '19:00',
    status: 'completed' as const,
    matchday: 'ربع النهائي',
  },
];

const stats = [
  { icon: Trophy, label: 'البطولات النشطة', value: 5, trend: { value: 12, isPositive: true } },
  { icon: Users, label: 'الفرق المشاركة', value: 48 },
  { icon: Calendar, label: 'المباريات هذا الأسبوع', value: 12 },
  { icon: Target, label: 'الأهداف المسجلة', value: 156, trend: { value: 8, isPositive: true } },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 gradient-hero" />
        
        <div className="relative container mx-auto px-4 py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-semibold">منصة إدارة البطولات الأذكى</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up leading-tight">
              نظّم بطولاتك
              <br />
              <span className="text-gradient">باحترافية</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up leading-relaxed">
              أنشئ وأدر بطولاتك الرياضية بسهولة تامة. من جدولة المباريات إلى تتبع النتائج والترتيب، كل ما تحتاجه في مكان واحد.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground glow-primary text-lg px-8 rounded-xl font-semibold"
                onClick={() => navigate('/tournaments')}
              >
                <Plus className="w-5 h-5 ml-2" />
                إنشاء بطولة جديدة
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 rounded-xl font-semibold"
                onClick={() => navigate('/tournaments')}
              >
                استكشف البطولات
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Live Matches Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                المباريات الحية
              </h2>
              <p className="text-muted-foreground">تابع آخر نتائج المباريات</p>
            </div>
            <Button 
              variant="ghost" 
              className="hidden sm:flex rounded-xl"
              onClick={() => navigate('/matches')}
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((match, index) => (
              <MatchCard key={index} {...match} />
            ))}
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="section-spacing bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                البطولات
              </h2>
              <p className="text-muted-foreground">استكشف البطولات النشطة والقادمة</p>
            </div>
            <Button 
              variant="ghost" 
              className="hidden sm:flex rounded-xl"
              onClick={() => navigate('/tournaments')}
            >
              عرض الكل
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} {...tournament} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-95" />
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-20"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
            
            <div className="relative p-10 md:p-16 lg:p-20 text-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
                جاهز لإنشاء بطولتك؟
              </h2>
              <p className="text-primary-foreground/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                ابدأ الآن مجاناً واستمتع بتجربة إدارة بطولات سلسة واحترافية
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-10 rounded-xl font-semibold shadow-lg"
                onClick={() => navigate('/tournaments')}
              >
                <Plus className="w-5 h-5 ml-2" />
                ابدأ الآن مجاناً
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Bottola</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Bottola. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
