import { Header } from '@/components/layout/Header';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { MatchCard } from '@/components/match/MatchCard';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Target, Plus, ArrowLeft, Sparkles, Play, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Using standard high-quality sports placeholder images for consistent look
const heroBg = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop";
const footballBg = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093&auto=format&fit=crop";

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
    name: 'دوري الأصدقاء المحترف',
    teams: 8,
    startDate: '1 مارس 2024',
    status: 'upcoming' as const,
    type: 'league' as const,
  },
  {
    id: '3',
    name: 'كأس النخبة الرمضاني',
    teams: 12,
    startDate: '10 يناير 2024',
    status: 'completed' as const,
    type: 'groups' as const,
  },
];

const matches = [
  {
    homeTeam: { name: 'النجوم FC', score: 2 },
    awayTeam: { name: 'صقور الجبل', score: 1 },
    date: '15 فبراير 2024',
    time: '18:00',
    status: 'live' as const,
    matchday: 'نصف النهائي',
  },
  {
    homeTeam: { name: 'أسود الأطلس' },
    awayTeam: { name: 'نمور الصحراء' },
    date: '16 فبراير 2024',
    time: '20:00',
    status: 'upcoming' as const,
    matchday: 'نصف النهائي',
  },
  {
    homeTeam: { name: 'العقبان الذهبية', score: 3 },
    awayTeam: { name: 'ذئاب المدينة', score: 0 },
    date: '14 فبراير 2024',
    time: '19:00',
    status: 'completed' as const,
    matchday: 'ربع النهائي',
  },
];

const stats = [
  { icon: Trophy, label: 'البطولات النشطة', value: 5, trend: { value: 12, isPositive: true } },
  { icon: Users, label: 'الفرق المشاركة', value: 48 },
  { icon: Zap, label: 'المباريات القادمة', value: 12 },
  { icon: Target, label: 'الأهداف المسجلة', value: 156, trend: { value: 8, isPositive: true } },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background Image with Parallax-like effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 z-0 scale-110"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background z-10" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] z-0 animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] z-0 animate-float" />

        <div className="relative container mx-auto px-4 z-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-10 animate-fade-in-up backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">منصة إدارة البطولات الاحترافية</span>
            </div>
            
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black mb-8 animate-fade-in-up leading-none tracking-tighter">
              ارتقِ ببطولتك
              <br />
              إلى <span className="text-gradient">مستوى النخبة</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in-up leading-relaxed font-medium">
              أقوى نظام لإدارة وتنظيم الدوريات الرياضية. تحكم كامل في الجدولة، النتائج، والترتيب بلمسة زر واحدة.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up">
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground glow-primary text-xl px-12 h-16 rounded-2xl font-black shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => navigate('/tournaments')}
              >
                <Plus className="w-6 h-6 ml-3" />
                أنشئ بطولة الآن
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xl px-10 h-16 rounded-2xl font-black border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 transition-all duration-300"
                onClick={() => navigate('/tournaments')}
              >
                <Play className="w-5 h-5 ml-3 text-primary fill-primary" />
                شاهد العرض
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-30 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">مميزات النظام</span>
                 </div>
                 <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tighter">
                    كل ما تحتاجه لإدارة
                    <br />
                    <span className="text-primary">ناجحة واحترافية</span>
                 </h2>
                 <div className="space-y-6">
                    {[
                      { title: "جدولة ذكية", desc: "توليد تلقائي للمباريات مع مراعاة الملاعب والأوقات المتاحة." },
                      { title: "نتائج مباشرة", desc: "تحديث فوري للنتائج وإحصائيات اللاعبين والفرق." },
                      { title: "لوحة تحكم شاملة", desc: "إدارة كاملة للفرق، اللاعبين، والحكام من مكان واحد." }
                    ].map((feature, i) => (
                      <div key={i} className="flex gap-4 p-6 rounded-2xl bg-secondary/20 border border-white/5 hover:border-primary/20 transition-all duration-300">
                         <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Zap className="w-6 h-6 text-primary" />
                         </div>
                         <div>
                            <h4 className="font-bold text-xl mb-1">{feature.title}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="relative">
                 <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-3xl z-0" />
                 <div className="relative z-10 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                    <img src={footballBg} alt="Sports Management" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-primary" />
                             </div>
                             <div>
                                <h5 className="font-bold text-sm">البطولة الكبرى</h5>
                                <p className="text-[10px] text-muted-foreground">نهائي الموسم</p>
                             </div>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase">جارية الآن</Badge>
                       </div>
                       <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 text-center font-black text-2xl">3</div>
                          <div className="px-3 py-1 rounded-lg bg-secondary/50 text-[10px] font-black">VS</div>
                          <div className="flex-1 text-center font-black text-2xl">1</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Live Matches Section */}
      <section className="section-spacing bg-secondary/10 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">مباشر الآن</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                المباريات الجارية
              </h2>
            </div>
            <Button 
              variant="ghost" 
              className="hidden sm:flex rounded-xl font-bold hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => navigate('/matches')}
            >
              عرض جدول المباريات
              <ArrowLeft className="w-4 h-4 mr-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches.map((match, index) => (
              <MatchCard key={index} {...match} />
            ))}
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="section-spacing relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 block">استكشف</span>
              <h2 className="font-display text-4xl md:text-5xl font-black text-foreground tracking-tighter">
                البطولات النشطة
              </h2>
            </div>
            <Button 
              variant="ghost" 
              className="hidden sm:flex rounded-xl font-bold hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => navigate('/tournaments')}
            >
              جميع البطولات
              <ArrowLeft className="w-4 h-4 mr-3" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} {...tournament} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing">
        <div className="container mx-auto px-4">
          <div className="relative rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-blue-900 z-10" />
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 z-0 scale-110"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
            
            <div className="relative z-20 p-12 md:p-24 text-center">
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-primary-foreground mb-8 tracking-tighter">
                كن جزءاً من مستقبل
                <br />
                الإدارة الرياضية
              </h2>
              <p className="text-primary-foreground/80 text-lg md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                انضم إلى آلاف المنظمين الذين اختاروا التميز والاحترافية في إدارة بطولاتهم.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <Button 
                    size="lg" 
                    variant="secondary" 
                    className="text-xl px-12 h-16 rounded-2xl font-black shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 bg-white text-primary hover:bg-white/90"
                    onClick={() => navigate('/tournaments')}
                 >
                    <Plus className="w-6 h-6 ml-3" />
                    ابدأ مجاناً الآن
                 </Button>
                 <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="w-12 h-12 rounded-full border-4 border-primary bg-secondary/80 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                          <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
                       </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-4 border-primary bg-white flex items-center justify-center text-[10px] font-black text-primary">
                       +5k
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
             <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="font-display text-3xl font-black tracking-tighter uppercase">Bottola</span>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                   المنصة الأولى عربياً لإدارة البطولات الرياضية باحترافية وسهولة تامة.
                </p>
             </div>
             <div className="space-y-6">
                <h4 className="font-black text-sm uppercase tracking-widest text-primary">روابط سريعة</h4>
                <ul className="space-y-4 text-muted-foreground font-bold">
                   <li className="hover:text-primary cursor-pointer transition-colors">البطولات</li>
                   <li className="hover:text-primary cursor-pointer transition-colors">جدول المباريات</li>
                   <li className="hover:text-primary cursor-pointer transition-colors">الفرق المشاركة</li>
                </ul>
             </div>
             <div className="space-y-6">
                <h4 className="font-black text-sm uppercase tracking-widest text-primary">تواصل معنا</h4>
                <ul className="space-y-4 text-muted-foreground font-bold">
                   <li className="hover:text-primary cursor-pointer transition-colors">الدعم الفني</li>
                   <li className="hover:text-primary cursor-pointer transition-colors">البريد الإلكتروني</li>
                   <li className="hover:text-primary cursor-pointer transition-colors">الأسئلة الشائعة</li>
                </ul>
             </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-white/5">
            <p className="text-sm text-muted-foreground font-bold">
              © 2024 Bottola. جميع الحقوق محفوظة. صُمم بشغف للرياضيين.
            </p>
            <div className="flex gap-6">
               <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors font-bold">سياسة الخصوصية</span>
               <span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors font-bold">شروط الخدمة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
