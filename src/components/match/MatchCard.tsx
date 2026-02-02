import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface MatchCardProps {
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'completed';
  matchday?: string;
  onClick?: () => void;
}

export function MatchCard({
  homeTeam,
  awayTeam,
  date,
  time,
  status,
  matchday,
  onClick,
}: MatchCardProps) {
  return (
    <div
      onClick={onClick}
      className="match-card p-4 cursor-pointer"
    >
      {/* Match Info */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{matchday}</span>
        {status === 'live' && (
          <Badge variant="destructive" className="animate-pulse-ring text-xs">
            مباشر
          </Badge>
        )}
        {status === 'upcoming' && (
          <Badge variant="outline" className="text-xs">
            {time}
          </Badge>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
              {homeTeam.logo || homeTeam.name.charAt(0)}
            </div>
            <span className={cn(
              "font-medium",
              status === 'completed' && homeTeam.score !== undefined && awayTeam.score !== undefined &&
              homeTeam.score > awayTeam.score && "text-primary"
            )}>
              {homeTeam.name}
            </span>
          </div>
          {(status === 'live' || status === 'completed') && homeTeam.score !== undefined && (
            <span className={cn(
              "font-display text-2xl font-bold",
              status === 'completed' && homeTeam.score > (awayTeam.score || 0) && "text-primary"
            )}>
              {homeTeam.score}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
              {awayTeam.logo || awayTeam.name.charAt(0)}
            </div>
            <span className={cn(
              "font-medium",
              status === 'completed' && awayTeam.score !== undefined && homeTeam.score !== undefined &&
              awayTeam.score > homeTeam.score && "text-primary"
            )}>
              {awayTeam.name}
            </span>
          </div>
          {(status === 'live' || status === 'completed') && awayTeam.score !== undefined && (
            <span className={cn(
              "font-display text-2xl font-bold",
              status === 'completed' && awayTeam.score > (homeTeam.score || 0) && "text-primary"
            )}>
              {awayTeam.score}
            </span>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}
