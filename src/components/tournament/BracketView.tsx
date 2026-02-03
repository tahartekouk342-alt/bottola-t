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
        'w-60 rounded-lg border overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-lg',
        isLive && 'border-destructive animate-pulse',
        isCompleted && 'border-primary/50',
        !isLive && !isCompleted && 'border-border'
      )}
      onClick={onClick}
    >
      {/* Status Badge */}
      {isLive && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1">
          🔴 مباشر
        </div>
      )}

      {/* Home Team */}
      <div
        className={cn(
          'flex items-center justify-between p-3 border-b border-border/50',
          isCompleted && match.winner_id === match.home_team_id && 'bg-primary/10'
        )}
      >
        <span
          className={cn(
            'font-medium truncate',
            isCompleted &&
              match.winner_id === match.home_team_id &&
              'text-primary font-bold'
          )}
        >
          {match.home_team?.name || 'TBD'}
        </span>
        <span
          className={cn(
            'font-display font-bold text-lg min-w-[2rem] text-center',
            isCompleted && match.winner_id === match.home_team_id && 'text-primary'
          )}
        >
          {isCompleted || isLive ? match.home_score : '-'}
        </span>
      </div>

      {/* Away Team */}
      <div
        className={cn(
          'flex items-center justify-between p-3',
          isCompleted && match.winner_id === match.away_team_id && 'bg-primary/10'
        )}
      >
        <span
          className={cn(
            'font-medium truncate',
            isCompleted &&
              match.winner_id === match.away_team_id &&
              'text-primary font-bold'
          )}
        >
          {match.away_team?.name || 'TBD'}
        </span>
        <span
          className={cn(
            'font-display font-bold text-lg min-w-[2rem] text-center',
            isCompleted && match.winner_id === match.away_team_id && 'text-primary'
          )}
        >
          {isCompleted || isLive ? match.away_score : '-'}
        </span>
      </div>
    </div>
  );
}
