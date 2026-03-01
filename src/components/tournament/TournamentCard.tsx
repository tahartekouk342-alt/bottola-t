import { Trophy, Users, Calendar, ChevronLeft, MapPin, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  id: string;
  name: string;
  teams: number;
  startDate: string;
  status: 'upcoming' | 'live' | 'completed';
  type: 'knockout' | 'league' | 'groups';
  logoUrl?: string | null;
  venueName?: string | null;
  onClick?: () => void;
}

const statusConfig = {
  upcoming: { label: 'قريباً', variant: 'secondary' as const, color: 'text-blue-400 bg-blue-400/10' },
  live: { label: 'جارية', variant: 'destructive' as const, color: 'text-red-400 bg-red-400/10' },
  completed: { label: 'منتهية', variant: 'outline' as const, color: 'text-emerald-400 bg-emerald-400/10' },
};

const typeConfig = {
  knockout: { label: 'إقصاء مباشر', icon: <Target className="w-4 h-4" /> },
  league: { label: 'دوري', icon: <Trophy className="w-4 h-4" /> },
  groups: { label: 'مجموعات + إقصاء', icon: <Users className="w-4 h-4" /> },
};

export function TournamentCard({ name, teams, startDate, status, type, logoUrl, venueName, onClick }: TournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "sports-card group relative overflow-hidden transition-all duration-500",
        status === 'live' && "border-primary/30 ring-1 ring-primary/20"
      )}
    >
      {/* Visual Header / Image Area */}
      <div className="relative h-48 overflow-hidden">
        {/* Background Image / Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors duration-500" />
        
        {/* Sport Icon Background Overlay */}
        <div className="absolute top-4 right-4 opacity-10 group-hover:scale-110 transition-transform duration-700 z-0">
           <Trophy className="w-32 h-32 rotate-12" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none backdrop-blur-md", statusConfig[status].color)}>
            {status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />}
            {statusConfig[status].label}
          </Badge>
        </div>

        {/* Tournament Logo Overlay */}
        <div className="absolute bottom-0 left-6 translate-y-1/2 z-20">
          <div className="w-20 h-20 rounded-2xl bg-card border-4 border-background shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-500">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-10 h-10 text-primary" />
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6 pt-12 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                بطولة رسمية
             </span>
             <h3 className="font-display text-2xl font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
               {name}
             </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
             <ChevronLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-white/5">
            <Users className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
               <span className="text-[10px] text-muted-foreground font-bold">الفرق</span>
               <span className="text-sm font-bold">{teams} فريق</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-white/5">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
               <span className="text-[10px] text-muted-foreground font-bold">البداية</span>
               <span className="text-sm font-bold">{startDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
           <div className="flex items-center gap-2 text-muted-foreground">
              {venueName ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold truncate max-w-[150px]">{venueName}</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold">ملاعب معتمدة</span>
                </>
              )}
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider">
              {typeConfig[type].icon}
              {typeConfig[type].label}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
