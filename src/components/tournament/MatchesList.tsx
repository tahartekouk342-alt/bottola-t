import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [motmDialogOpen, setMotmDialogOpen] = useState(false);
  const [selectedMotm, setSelectedMotm] = useState<string | null>(null);

  const homeWon = match.home_score !== null && match.away_score !== null && match.home_score > match.away_score;
  const awayWon = match.home_score !== null && match.away_score !== null && match.away_score > match.home_score;

  const handleMotmSelect = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMotm(teamId);
  };

  return (
    <>
      <div
        className={cn(
          'rounded-[1.75rem] border overflow-hidden cursor-pointer transition-all hover:shadow-lg group',
          isLive && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          homeWon && 'bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-amber-500/20 border-yellow-500/30',
          awayWon && 'bg-gradient-to-br from-yellow-500/20 via-yellow-400/10 to-amber-500/20 border-yellow-500/30',
          !homeWon && !awayWon && 'bg-card',
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
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center shadow-sm border-2 group-hover:scale-110 transition-transform relative',
              homeWon && isCompleted ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-600 shadow-lg shadow-yellow-500/50' : 'bg-muted border-border'
            )}>
              {match.home_team?.logo_url ? (
                <img src={match.home_team.logo_url} alt={match.home_team.name} className="w-10 h-10 object-contain" />
              ) : (
                <span className={cn('text-lg font-bold', homeWon && isCompleted ? 'text-white' : 'text-primary')}>
                  {match.home_team?.name?.charAt(0) || '?'}
                </span>
              )}
              {homeWon && isCompleted && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                  <Star className="w-4 h-4 fill-yellow-600 text-yellow-600" />
                </div>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.home_team?.name || 'TBD'}</span>
            {isCompleted && (
              <Button
                size="sm"
                variant={selectedMotm === match.home_team?.id ? 'default' : 'ghost'}
                className="text-[9px] h-6 px-2 gap-1"
                onClick={(e) => handleMotmSelect(match.home_team?.id || '', e)}
              >
                <Star className="w-3 h-3" />
                MOTM
              </Button>
            )}
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {(isLive || isCompleted) ? (
              <div className="flex items-center gap-2">
                <span className={cn('text-2xl font-black tabular-nums', isLive && 'text-primary', homeWon && isCompleted && 'text-yellow-600')}>
                  {match.home_score ?? 0}
                </span>
                <span className="text-muted-foreground font-bold">-</span>
                <span className={cn('text-2xl font-black tabular-nums', isLive && 'text-primary', awayWon && isCompleted && 'text-yellow-600')}>
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
            <div className={cn(
              'w-14 h-14 rounded-xl flex items-center justify-center shadow-sm border-2 group-hover:scale-110 transition-transform relative',
              awayWon && isCompleted ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-600 shadow-lg shadow-yellow-500/50' : 'bg-muted border-border'
            )}>
              {match.away_team?.logo_url ? (
                <img src={match.away_team.logo_url} alt={match.away_team.name} className="w-10 h-10 object-contain" />
              ) : (
                <span className={cn('text-lg font-bold', awayWon && isCompleted ? 'text-white' : 'text-primary')}>
                  {match.away_team?.name?.charAt(0) || '?'}
                </span>
              )}
              {awayWon && isCompleted && (
                <div className="absolute -top-2 -left-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                  <Star className="w-4 h-4 fill-yellow-600 text-yellow-600" />
                </div>
              )}
            </div>
            <span className="font-bold text-xs line-clamp-1">{match.away_team?.name || 'TBD'}</span>
            {isCompleted && (
              <Button
                size="sm"
                variant={selectedMotm === match.away_team?.id ? 'default' : 'ghost'}
                className="text-[9px] h-6 px-2 gap-1"
                onClick={(e) => handleMotmSelect(match.away_team?.id || '', e)}
              >
                <Star className="w-3 h-3" />
                MOTM
              </Button>
            )}
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

        {/* MOTM Display */}
        {selectedMotm && (
          <div className="mt-2 pt-2 border-t border-dashed border-yellow-500/30 flex items-center justify-center gap-1 text-[10px] font-bold text-yellow-600">
            <Star className="w-3 h-3 fill-yellow-500" />
            رجل المباراة المختار
          </div>
        )}
      </div>
    </div>
    </>
  );
}
