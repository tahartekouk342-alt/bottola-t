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
        "card-interactive group relative overflow-hidden transition-all duration-500 rounded-3xl",
        status === 'live' && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      {/* Visual Header / Image Area */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/30">
        {/* Background Image / Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
        
        {/* Sport Icon Background Overlay */}
        <div className="absolute top-4 right-4 opacity-8 group-hover:scale-110 transition-transform duration-700 z-0">
           <Trophy className="w-40 h-40 rotate-12" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-20">
          <Badge className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border-none backdrop-blur-md", statusConfig[status].color)}>
            {status === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
            {statusConfig[status].label}
          </Badge>
        </div>

        {/* Tournament Logo Overlay */}
        <div className="absolute bottom-0 left-6 translate-y-1/2 z-20">
          <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-12 h-12 text-primary" />
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6 pt-16 relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex flex-col gap-2 flex-1">
             <span className="text-xs font-bold text-primary uppercase tracking-wider">
                بطولة رسمية
             </span>
             <h3 className="font-display text-2xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
               {name}
             </h3>
          </div>
          <div className="w-11 h-11 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex-shrink-0 mr-2">
             <ChevronLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-secondary/40 border border-white/5 hover:border-primary/30 transition-colors duration-300">
            <Users className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex flex-col min-w-0">
               <span className="text-xs text-muted-foreground font-bold">الفرق</span>
               <span className="text-sm font-bold truncate">{teams} فريق</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-secondary/40 border border-white/5 hover:border-primary/30 transition-colors duration-300">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex flex-col min-w-0">
               <span className="text-xs text-muted-foreground font-bold">البداية</span>
               <span className="text-sm font-bold truncate">{startDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-white/5">
           <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300">
              {venueName ? (
                <>
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-bold truncate max-w-[140px]">{venueName}</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-bold">ملاعب معتمدة</span>
                </>
              )}
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-colors duration-300">
              {typeConfig[type].icon}
              <span className="hidden sm:inline">{typeConfig[type].label}</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
