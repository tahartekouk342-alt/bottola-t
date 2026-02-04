import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

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
      className={cn(
        "card-interactive p-5 group",
        status === 'live' && "border-destructive/50 bg-destructive/5"
      )}
    >
      {/* Match Info Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground line-clamp-1">
          {matchday}
        </span>
        {status === 'live' && (
          <Badge variant="destructive" className="animate-pulse text-xs font-semibold">
            <span className="w-2 h-2 bg-white rounded-full mr-1.5 animate-ping" />
            مباشر
          </Badge>
        )}
        {status === 'upcoming' && (
          <Badge variant="secondary" className="text-xs font-medium">
            <Clock className="w-3 h-3 ml-1" />
            {time}
          </Badge>
        )}
        {status === 'completed' && (
          <Badge variant="outline" className="text-xs font-medium">
            انتهت
          </Badge>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-4">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-lg font-bold shadow-sm",
              "group-hover:scale-105 transition-transform duration-300"
            )}>
              {homeTeam.logo || homeTeam.name.charAt(0)}
            </div>
            <span className={cn(
              "font-semibold text-foreground",
              status === 'completed' && homeTeam.score !== undefined && awayTeam.score !== undefined &&
              homeTeam.score > awayTeam.score && "text-primary"
            )}>
              {homeTeam.name}
            </span>
          </div>
          {(status === 'live' || status === 'completed') && homeTeam.score !== undefined && (
            <span className={cn(
              "font-display text-2xl font-bold tabular-nums",
              status === 'live' && "text-destructive",
              status === 'completed' && homeTeam.score > (awayTeam.score || 0) && "text-primary"
            )}>
              {homeTeam.score}
            </span>
          )}
        </div>

        {/* VS Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-card text-xs text-muted-foreground font-medium">VS</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-lg font-bold shadow-sm",
              "group-hover:scale-105 transition-transform duration-300"
            )}>
              {awayTeam.logo || awayTeam.name.charAt(0)}
            </div>
            <span className={cn(
              "font-semibold text-foreground",
              status === 'completed' && awayTeam.score !== undefined && homeTeam.score !== undefined &&
              awayTeam.score > homeTeam.score && "text-primary"
            )}>
              {awayTeam.name}
            </span>
          </div>
          {(status === 'live' || status === 'completed') && awayTeam.score !== undefined && (
            <span className={cn(
              "font-display text-2xl font-bold tabular-nums",
              status === 'live' && "text-destructive",
              status === 'completed' && awayTeam.score > (homeTeam.score || 0) && "text-primary"
            )}>
              {awayTeam.score}
            </span>
          )}
        </div>
      </div>

      {/* Date Footer */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{date}</span>
      </div>
    </div>
  );
}
