import { Trophy, Users, Calendar, ChevronLeft } from 'lucide-react';
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
  onClick?: () => void;
}

const statusLabels = {
  upcoming: 'قريباً',
  live: 'جارية',
  completed: 'منتهية',
};

const typeLabels = {
  knockout: 'خروج المغلوب',
  league: 'دوري',
  groups: 'مجموعات',
};

export function TournamentCard({
  name,
  teams,
  startDate,
  status,
  type,
  onClick,
}: TournamentCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "match-card cursor-pointer group",
        "gradient-card"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <Badge
            variant={status === 'live' ? 'destructive' : status === 'upcoming' ? 'default' : 'secondary'}
            className={cn(
              status === 'live' && "animate-pulse-ring"
            )}
          >
            {statusLabels[status]}
          </Badge>
        </div>

        <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{teams} فريق</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{startDate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Badge variant="outline" className="text-xs">
            {typeLabels[type]}
          </Badge>
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );
}
