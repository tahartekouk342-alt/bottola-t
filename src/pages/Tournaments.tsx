import { Header } from '@/components/layout/Header';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

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
  {
    id: '4',
    name: 'بطولة الشتاء',
    teams: 8,
    startDate: '20 ديسمبر 2023',
    status: 'completed' as const,
    type: 'knockout' as const,
  },
  {
    id: '5',
    name: 'دوري الربيع',
    teams: 10,
    startDate: '15 مارس 2024',
    status: 'upcoming' as const,
    type: 'league' as const,
  },
  {
    id: '6',
    name: 'كأس الصيف',
    teams: 16,
    startDate: '1 يونيو 2024',
    status: 'upcoming' as const,
    type: 'groups' as const,
  },
];

const TournamentsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                البطولات
              </h1>
              <p className="text-muted-foreground">إدارة واستعراض جميع البطولات</p>
            </div>
            <Button className="gradient-primary text-primary-foreground glow-primary">
              <Plus className="w-5 h-5 ml-2" />
              إنشاء بطولة جديدة
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="البحث عن بطولة..."
                className="pr-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="live">جارية</SelectItem>
                <SelectItem value="upcoming">قريباً</SelectItem>
                <SelectItem value="completed">منتهية</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="knockout">خروج المغلوب</SelectItem>
                <SelectItem value="league">دوري</SelectItem>
                <SelectItem value="groups">مجموعات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tournaments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} {...tournament} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TournamentsPage;
