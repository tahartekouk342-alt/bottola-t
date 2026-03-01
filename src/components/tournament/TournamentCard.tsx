import { Trophy, Users, Calendar, ChevronLeft, MapPin, Clock } from 'lucide-react';
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
  upcoming: { label: 'قريباً', variant: 'secondary' as const },
  live: { label: 'جارية', variant: 'destructive' as const },
  completed: { label: 'منتهية', variant: 'outline' as const },
};

const typeConfig = {
  knockout: { label: 'إقصاء مباشر', icon: '⚔️' },
  league: { label: 'دوري', icon: '🏆' },
  groups: { label: 'مجموعات + إقصاء', icon: '📊' },
};

export function TournamentCard({ name, teams, startDate, status, type, logoUrl, venueName, onClick }: TournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "overflow-hidden cursor-pointer group transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
        status === 'live' && "border-destructive/40"
      )}
    >
      <div className={cn(
        "relative h-20 p-4 flex items-end",
        "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent",
        status === 'live' && "from-destructive/15 via-destructive/5"
      )}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 text-5xl">{typeConfig[type].icon}</div>
        </div>

        <div className="relative flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-10 h-10 rounded-xl object-cover shadow-md border bg-background" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur flex items-center justify-center shadow-md">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
            )}
            <Badge variant={statusConfig[status].variant} className="font-semibold">
              {status === 'live' && <span className="w-1.5 h-1.5 bg-destructive-foreground rounded-full mr-1.5 animate-pulse" />}
              {statusConfig[status].label}
            </Badge>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all duration-300" />
        </div>
      </div>

      <CardContent className="p-5 pt-4">
        <h3 className="font-display text-xl font-bold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" /><span>{teams} فريق</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" /><span>{startDate}</span>
          </div>
          {venueName && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /><span className="truncate max-w-[120px]">{venueName}</span>
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-border/50">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>{typeConfig[type].icon}</span>{typeConfig[type].label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
