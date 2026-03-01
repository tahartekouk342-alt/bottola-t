import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trophy } from 'lucide-react';

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
        "sports-card p-6 group cursor-pointer relative overflow-hidden",
        status === 'live' && "border-primary/40 ring-1 ring-primary/20"
      )}
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
      
      {/* Match Info Header */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
            {matchday || 'مباراة'}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-medium">{date}</span>
          </div>
        </div>

        {status === 'live' && (
          <div className="live-indicator">
            مباشر
          </div>
        )}
        {status === 'upcoming' && (
          <Badge variant="secondary" className="bg-secondary/80 text-foreground border-none px-3 py-1 rounded-full text-[10px] font-bold">
            <Clock className="w-3 h-3 ml-1" />
            {time}
          </Badge>
        )}
        {status === 'completed' && (
          <Badge variant="outline" className="border-white/10 text-muted-foreground px-3 py-1 rounded-full text-[10px] font-bold">
            انتهت
          </Badge>
        )}
      </div>

      {/* Teams Display */}
      <div className="flex items-center justify-between gap-4 relative z-10">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-2xl font-bold shadow-lg mb-3 border border-white/5",
            "group-hover:scale-110 transition-transform duration-500 group-hover:shadow-primary/20",
            status === 'completed' && homeTeam.score !== undefined && awayTeam.score !== undefined &&
            homeTeam.score > awayTeam.score && "ring-2 ring-primary ring-offset-4 ring-offset-card"
          )}>
            {homeTeam.logo ? (
               <img src={homeTeam.logo} alt={homeTeam.name} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-primary">{homeTeam.name.charAt(0)}</span>
            )}
          </div>
          <span className={cn(
            "font-bold text-sm text-foreground line-clamp-1",
            status === 'completed' && homeTeam.score !== undefined && awayTeam.score !== undefined &&
            homeTeam.score > awayTeam.score && "text-primary"
          )}>
            {homeTeam.name}
          </span>
        </div>

        {/* Score / VS Area */}
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          {(status === 'live' || status === 'completed') && homeTeam.score !== undefined && awayTeam.score !== undefined ? (
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-display text-4xl font-black tabular-nums tracking-tighter",
                status === 'live' && "text-primary animate-pulse",
                status === 'completed' && homeTeam.score > awayTeam.score && "text-primary"
              )}>
                {homeTeam.score}
              </span>
              <span className="text-muted-foreground font-black text-xl">-</span>
              <span className={cn(
                "font-display text-4xl font-black tabular-nums tracking-tighter",
                status === 'live' && "text-primary animate-pulse",
                status === 'completed' && awayTeam.score > homeTeam.score && "text-primary"
              )}>
                {awayTeam.score}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mb-1">
                <span className="text-xs font-black text-muted-foreground">VS</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{time}</span>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-2xl font-bold shadow-lg mb-3 border border-white/5",
            "group-hover:scale-110 transition-transform duration-500 group-hover:shadow-primary/20",
            status === 'completed' && awayTeam.score !== undefined && homeTeam.score !== undefined &&
            awayTeam.score > homeTeam.score && "ring-2 ring-primary ring-offset-4 ring-offset-card"
          )}>
            {awayTeam.logo ? (
               <img src={awayTeam.logo} alt={awayTeam.name} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-primary">{awayTeam.name.charAt(0)}</span>
            )}
          </div>
          <span className={cn(
            "font-bold text-sm text-foreground line-clamp-1",
            status === 'completed' && awayTeam.score !== undefined && homeTeam.score !== undefined &&
            awayTeam.score > homeTeam.score && "text-primary"
          )}>
            {awayTeam.name}
          </span>
        </div>
      </div>

      {/* Match Footer Details */}
      {status === 'completed' && (
        <div className="mt-6 flex justify-center relative z-10">
          <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
            <Trophy className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary">
              فوز {homeTeam.score! > awayTeam.score! ? homeTeam.name : awayTeam.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
