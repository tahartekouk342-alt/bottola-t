import { Header } from '@/components/layout/Header';
import { MatchCard } from '@/components/match/MatchCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, PlayCircle, CheckCircle, Clock } from 'lucide-react';

const liveMatches = [
  {
    homeTeam: { name: 'النجوم', score: 2 },
    awayTeam: { name: 'الصقور', score: 1 },
    date: '15 فبراير 2024',
    time: '18:00',
    status: 'live' as const,
    matchday: 'نصف النهائي - بطولة الأبطال',
  },
  {
    homeTeam: { name: 'الأسود', score: 0 },
    awayTeam: { name: 'النمور', score: 0 },
    date: '15 فبراير 2024',
    time: '18:30',
    status: 'live' as const,
    matchday: 'الجولة 5 - دوري الأصدقاء',
  },
];

const upcomingMatches = [
  {
    homeTeam: { name: 'العقبان' },
    awayTeam: { name: 'الذئاب' },
    date: '16 فبراير 2024',
    time: '17:00',
    status: 'upcoming' as const,
    matchday: 'نصف النهائي - بطولة الأبطال',
  },
  {
    homeTeam: { name: 'الفهود' },
    awayTeam: { name: 'الأسود' },
    date: '16 فبراير 2024',
    time: '19:00',
    status: 'upcoming' as const,
    matchday: 'الجولة 5 - دوري الأصدقاء',
  },
  {
    homeTeam: { name: 'النجوم' },
    awayTeam: { name: 'الصقور' },
    date: '17 فبراير 2024',
    time: '18:00',
    status: 'upcoming' as const,
    matchday: 'الجولة 6 - دوري الأصدقاء',
  },
];

const completedMatches = [
  {
    homeTeam: { name: 'العقبان', score: 3 },
    awayTeam: { name: 'الذئاب', score: 0 },
    date: '14 فبراير 2024',
    time: '19:00',
    status: 'completed' as const,
    matchday: 'ربع النهائي - بطولة الأبطال',
  },
  {
    homeTeam: { name: 'النجوم', score: 2 },
    awayTeam: { name: 'الفهود', score: 2 },
    date: '13 فبراير 2024',
    time: '18:00',
    status: 'completed' as const,
    matchday: 'الجولة 4 - دوري الأصدقاء',
  },
  {
    homeTeam: { name: 'الأسود', score: 1 },
    awayTeam: { name: 'النمور', score: 3 },
    date: '12 فبراير 2024',
    time: '17:30',
    status: 'completed' as const,
    matchday: 'ربع النهائي - بطولة الأبطال',
  },
];

const MatchesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  المباريات
                </h1>
                <p className="text-muted-foreground">تابع جميع المباريات الحية والقادمة</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="live" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="live" 
                className="relative rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <PlayCircle className="w-4 h-4 ml-2" />
                مباشر
                {liveMatches.length > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-semibold px-1.5 animate-pulse">
                    {liveMatches.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Clock className="w-4 h-4 ml-2" />
                قادمة
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                منتهية
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {liveMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {liveMatches.map((match, index) => (
                    <MatchCard key={index} {...match} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <PlayCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg">لا توجد مباريات مباشرة حالياً</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingMatches.map((match, index) => (
                  <MatchCard key={index} {...match} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {completedMatches.map((match, index) => (
                  <MatchCard key={index} {...match} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default MatchesPage;
