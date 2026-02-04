import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface MatchesListProps {
  matches: MatchWithTeams[];
  onMatchClick?: (match: MatchWithTeams) => void;
  getRoundName?: (round: number, totalRounds: number) => string;
  showDate?: boolean;
  compact?: boolean;
}

const statusMap = {
  scheduled: { label: 'مجدولة', variant: 'secondary' as const },
  live: { label: '🔴 مباشر', variant: 'destructive' as const },
  completed: { label: 'انتهت', variant: 'outline' as const },
};

export function MatchesList({
  matches,
  onMatchClick,
  getRoundName,
  showDate = true,
  compact = false,
}: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد مباريات
      </div>
    );
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, MatchWithTeams[]>);

  const totalRounds = Math.max(...matches.map((m) => m.round));

  return (
    <div className="space-y-6">
      {Object.entries(matchesByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <div key={round}>
            <h3 className="font-bold text-lg mb-3 text-primary">
              {getRoundName
                ? getRoundName(Number(round), totalRounds)
                : `الجولة ${round}`}
            </h3>
            <div className={cn('space-y-3', compact && 'space-y-2')}>
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                  showDate={showDate}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

interface MatchCardProps {
  match: MatchWithTeams;
  onClick?: () => void;
  showDate?: boolean;
  compact?: boolean;
}

function MatchCard({ match, onClick, showDate, compact }: MatchCardProps) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <div
      className={cn(
        'rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md',
        isLive && 'border-destructive',
        isCompleted && 'border-primary/30',
        !isLive && !isCompleted && 'border-border',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 text-right">
          <span
            className={cn(
              'font-medium',
              isCompleted && match.winner_id === match.home_team_id && 'text-primary font-bold'
            )}
          >
            {match.home_team?.name || 'TBD'}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-4">
          <span
            className={cn(
              'font-display font-bold text-xl min-w-[2rem] text-center',
              isCompleted && match.winner_id === match.home_team_id && 'text-primary'
            )}
          >
            {isCompleted || isLive ? match.home_score : '-'}
          </span>
          <span className="text-muted-foreground">:</span>
          <span
            className={cn(
              'font-display font-bold text-xl min-w-[2rem] text-center',
              isCompleted && match.winner_id === match.away_team_id && 'text-primary'
            )}
          >
            {isCompleted || isLive ? match.away_score : '-'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left">
          <span
            className={cn(
              'font-medium',
              isCompleted && match.winner_id === match.away_team_id && 'text-primary font-bold'
            )}
          >
            {match.away_team?.name || 'TBD'}
          </span>
        </div>
      </div>

      {/* Match Info */}
      {!compact && (
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
          <Badge variant={statusMap[match.status].variant}>
            {statusMap[match.status].label}
          </Badge>
          {showDate && match.match_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(match.match_date).toLocaleDateString('ar-SA')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
