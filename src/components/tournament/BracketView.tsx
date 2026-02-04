import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { MatchWithTeams } from '@/hooks/useTournamentDetails';

interface BracketViewProps {
  matches: MatchWithTeams[];
  getRoundName: (round: number, totalRounds: number) => string;
  onMatchClick?: (match: MatchWithTeams) => void;
}

export function BracketView({
  matches,
  getRoundName,
  onMatchClick,
}: BracketViewProps) {
  const { rounds, totalRounds } = useMemo(() => {
    const roundsMap = new Map<number, MatchWithTeams[]>();

    matches.forEach((match) => {
      const round = match.round;
      if (!roundsMap.has(round)) {
        roundsMap.set(round, []);
      }
      roundsMap.get(round)?.push(match);
    });

    const sortedRounds = Array.from(roundsMap.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    const total = sortedRounds.length;

    return { rounds: sortedRounds, totalRounds: total };
  }, [matches]);

  if (rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        لا توجد مباريات بعد
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max p-4">
        {rounds.map(([roundNum, roundMatches], roundIndex) => (
          <div key={roundNum} className="flex flex-col">
            {/* Round Header */}
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg text-primary">
                {getRoundName(roundNum, totalRounds)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {roundMatches.length} مباراة
              </span>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col justify-around flex-1 gap-4"
              style={{
                paddingTop: `${roundIndex * 40}px`,
                paddingBottom: `${roundIndex * 40}px`,
              }}
            >
              {roundMatches.map((match) => (
                <BracketMatch
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BracketMatchProps {
  match: MatchWithTeams;
  onClick?: () => void;
}

function BracketMatch({ match, onClick }: BracketMatchProps) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <div
      className={cn(
        'w-64 rounded-xl border overflow-hidden cursor-pointer transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg hover:border-primary/50',
        isLive && 'border-destructive shadow-[0_0_20px_hsl(var(--destructive)/0.3)]',
        isCompleted && 'border-primary/40',
        !isLive && !isCompleted && 'border-border bg-card'
      )}
      onClick={onClick}
    >
      {/* Status Badge */}
      {isLive && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          مباشر
        </div>
      )}

      {/* Home Team */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-border/30',
          isCompleted && match.winner_id === match.home_team_id && 'bg-primary/10'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
            {match.home_team?.name?.charAt(0) || '?'}
          </div>
          <span
            className={cn(
              'font-semibold truncate max-w-[120px]',
              isCompleted &&
                match.winner_id === match.home_team_id &&
                'text-primary'
            )}
          >
            {match.home_team?.name || 'TBD'}
          </span>
        </div>
        <span
          className={cn(
            'font-display font-bold text-xl min-w-[2rem] text-center tabular-nums',
            isCompleted && match.winner_id === match.home_team_id && 'text-primary',
            isLive && 'text-destructive'
          )}
        >
          {isCompleted || isLive ? match.home_score : '-'}
        </span>
      </div>

      {/* Away Team */}
      <div
        className={cn(
          'flex items-center justify-between p-4',
          isCompleted && match.winner_id === match.away_team_id && 'bg-primary/10'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold">
            {match.away_team?.name?.charAt(0) || '?'}
          </div>
          <span
            className={cn(
              'font-semibold truncate max-w-[120px]',
              isCompleted &&
                match.winner_id === match.away_team_id &&
                'text-primary'
            )}
          >
            {match.away_team?.name || 'TBD'}
          </span>
        </div>
        <span
          className={cn(
            'font-display font-bold text-xl min-w-[2rem] text-center tabular-nums',
            isCompleted && match.winner_id === match.away_team_id && 'text-primary',
            isLive && 'text-destructive'
          )}
        >
          {isCompleted || isLive ? match.away_score : '-'}
        </span>
      </div>
    </div>
  );
}
