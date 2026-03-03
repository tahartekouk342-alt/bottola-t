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
  venueName?: string;
  stadiumImageUrl?: string;
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
  venueName,
  stadiumImageUrl,
}: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد مباريات
      </div>
    );
  }

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
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', compact && 'gap-2')}>
              {roundMatches.map((match) => (
                <MatchCardInline
                  key={match.id}
                  match={match}
                  onClick={() => onMatchClick?.(match)}
                  showDate={showDate}
                  venueName={venueName}
                  stadiumImageUrl={stadiumImageUrl}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

interface MatchCardInlineProps {
  match: MatchWithTeams;
  onClick?: () => void;
  showDate?: boolean;
  venueName?: string;
  stadiumImageUrl?: string;
}

function MatchCardInline({ match, onClick, showDate, venueName, stadiumImageUrl }: MatchCardInlineProps) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const imgSrc = stadiumImageUrl || '/images/sport-stadium.jpg';

  return (
    <div
      className={cn(
        'rounded-[1.75rem] border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-lg group',
        isLive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
      onClick={onClick}
    >
      {/* Stadium Mini Image Header */}
      <div className="relative h-24 overflow-hidden">
        <img
          src={imgSrc}
          alt={venueName || 'الملعب'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

        {(venueName || match.match_date) && (
          <div className="absolute bottom-2 right-3 flex items-center gap-2">
            {venueName && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-foreground/70 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {venueName}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 pt-2">
        {/* Status Row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">مباراة</span>

          {isLive && (
            <div className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive-foreground" />
              مباشر
            </div>
          )}
          {isCompleted && (
            <Badge variant="outline" className="text-[10px] font-bold border-muted text-muted-foreground">انتهت</Badge>
          )}
          {!isLive && !isCompleted && showDate && match.match_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(match.match_date).toLocaleDateString('ar-SA')}
            </span>
          )}
        </div>

        {/* Teams Display */}
        <div className="flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
              {match.home_team?.logo_url ? (
                <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-lg font-bold text-primary">{match.home_team?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.home_team?.name || 'TBD'}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {(isLive || isCompleted) ? (
              <div className="flex items-center gap-2">
                <span className={cn('text-2xl font-black tabular-nums', isLive && 'text-primary')}>
                  {match.home_score ?? 0}
                </span>
                <span className="text-muted-foreground font-bold">-</span>
                <span className={cn('text-2xl font-black tabular-nums', isLive && 'text-primary')}>
                  {match.away_score ?? 0}
                </span>
              </div>
            ) : (
              <div className="bg-muted/50 px-3 py-1 rounded-full">
                <span className="text-[10px] font-black text-muted-foreground">
                  {match.match_time || 'VS'}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 text-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform">
              {match.away_team?.logo_url ? (
                <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-lg font-bold text-primary">{match.away_team?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.away_team?.name || 'TBD'}</span>
          </div>
        </div>

        {/* Time for upcoming */}
        {!isLive && !isCompleted && match.match_time && (
          <div className="mt-3 pt-2 border-t border-dashed border-border flex justify-center">
            <span className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold">
              <Clock className="w-3 h-3" />
              {match.match_time}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}