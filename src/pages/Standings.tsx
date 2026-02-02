import { Header } from '@/components/layout/Header';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy } from 'lucide-react';

const standings = [
  {
    position: 1,
    name: 'النجوم',
    played: 5,
    won: 4,
    drawn: 1,
    lost: 0,
    goalsFor: 12,
    goalsAgainst: 3,
    goalDifference: 9,
    points: 13,
    form: ['W', 'W', 'D', 'W', 'W'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 2,
    name: 'الصقور',
    played: 5,
    won: 3,
    drawn: 2,
    lost: 0,
    goalsFor: 10,
    goalsAgainst: 4,
    goalDifference: 6,
    points: 11,
    form: ['W', 'D', 'W', 'D', 'W'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 3,
    name: 'الأسود',
    played: 5,
    won: 3,
    drawn: 1,
    lost: 1,
    goalsFor: 8,
    goalsAgainst: 5,
    goalDifference: 3,
    points: 10,
    form: ['W', 'L', 'W', 'D', 'W'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 4,
    name: 'النمور',
    played: 5,
    won: 2,
    drawn: 2,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 5,
    goalDifference: 2,
    points: 8,
    form: ['D', 'W', 'L', 'D', 'W'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 5,
    name: 'العقبان',
    played: 5,
    won: 2,
    drawn: 1,
    lost: 2,
    goalsFor: 6,
    goalsAgainst: 6,
    goalDifference: 0,
    points: 7,
    form: ['L', 'W', 'D', 'L', 'W'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 6,
    name: 'الفهود',
    played: 5,
    won: 1,
    drawn: 2,
    lost: 2,
    goalsFor: 5,
    goalsAgainst: 7,
    goalDifference: -2,
    points: 5,
    form: ['D', 'L', 'W', 'D', 'L'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 7,
    name: 'الذئاب',
    played: 5,
    won: 1,
    drawn: 1,
    lost: 3,
    goalsFor: 4,
    goalsAgainst: 9,
    goalDifference: -5,
    points: 4,
    form: ['L', 'D', 'L', 'W', 'L'] as ('W' | 'D' | 'L')[],
  },
  {
    position: 8,
    name: 'الثعالب',
    played: 5,
    won: 0,
    drawn: 2,
    lost: 3,
    goalsFor: 2,
    goalsAgainst: 11,
    goalDifference: -9,
    points: 2,
    form: ['L', 'L', 'D', 'L', 'D'] as ('W' | 'D' | 'L')[],
  },
];

const StandingsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                جدول الترتيب
              </h1>
              <p className="text-muted-foreground">ترتيب الفرق في البطولات المختلفة</p>
            </div>
            <Select defaultValue="league">
              <SelectTrigger className="w-full md:w-64">
                <Trophy className="w-4 h-4 ml-2" />
                <SelectValue placeholder="اختر البطولة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="league">دوري الأصدقاء</SelectItem>
                <SelectItem value="champions">بطولة الأبطال</SelectItem>
                <SelectItem value="cup">كأس الحي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">تأهل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm text-muted-foreground">هبوط</span>
            </div>
          </div>

          {/* Standings Table */}
          <StandingsTable
            standings={standings}
            highlightPositions={{
              promotion: [1, 2],
              relegation: [7, 8],
            }}
          />

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-display font-bold text-primary">54</p>
              <p className="text-sm text-muted-foreground">إجمالي الأهداف</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-display font-bold text-foreground">20</p>
              <p className="text-sm text-muted-foreground">المباريات</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-display font-bold text-accent">2.7</p>
              <p className="text-sm text-muted-foreground">معدل الأهداف</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-display font-bold text-foreground">النجوم</p>
              <p className="text-sm text-muted-foreground">المتصدر</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StandingsPage;
