import { Header } from '@/components/layout/Header';
import { StandingsTable } from '@/components/standings/StandingsTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Target, Calendar, Users } from 'lucide-react';

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  جدول الترتيب
                </h1>
                <p className="text-muted-foreground">ترتيب الفرق في البطولات المختلفة</p>
              </div>
            </div>
            <Select defaultValue="league">
              <SelectTrigger className="w-full md:w-64 rounded-xl border-border/50 bg-card">
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
          <div className="flex flex-wrap gap-6 mb-8 p-4 rounded-2xl bg-card/50 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary shadow-sm" />
              <span className="text-sm font-medium text-foreground">تأهل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive shadow-sm" />
              <span className="text-sm font-medium text-foreground">هبوط</span>
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs px-2 py-1 rounded bg-success/10 text-success font-semibold">ف</span>
              <span className="text-xs text-muted-foreground">فوز</span>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-semibold mr-2">ت</span>
              <span className="text-xs text-muted-foreground">تعادل</span>
              <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive font-semibold mr-2">خ</span>
              <span className="text-xs text-muted-foreground">خسارة</span>
            </div>
          </div>

          {/* Standings Table */}
          <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm">
            <StandingsTable
              standings={standings}
              highlightPositions={{
                promotion: [1, 2],
                relegation: [7, 8],
              }}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-5 rounded-2xl bg-card border border-border/50 text-center group hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-display font-bold text-primary mb-1">54</p>
              <p className="text-sm text-muted-foreground font-medium">إجمالي الأهداف</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/50 text-center group hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground mb-1">20</p>
              <p className="text-sm text-muted-foreground font-medium">المباريات</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/50 text-center group hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Target className="w-5 h-5 text-accent group-hover:text-primary transition-colors" />
              </div>
              <p className="text-3xl font-display font-bold text-accent mb-1">2.7</p>
              <p className="text-sm text-muted-foreground font-medium">معدل الأهداف</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border/50 text-center group hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground mb-1">النجوم</p>
              <p className="text-sm text-muted-foreground font-medium">المتصدر</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StandingsPage;
