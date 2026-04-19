import { Trophy, Users, Calendar, ChevronLeft, MapPin, Target, Gavel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  id: string;
  name: string;
  teams: number;
  startDate: string;
  status: 'upcoming' | 'live' | 'completed' | 'draft';
  type: 'knockout' | 'league' | 'groups';
  sportType?: 'football' | 'basketball';
  logoUrl?: string | null;
  venueName?: string | null;
  stadiumImageUrl?: string | null;
  refereeName?: string | null;
  onClick?: () => void;
}

export function TournamentCard({ name, teams, startDate, status, type, sportType = 'football', logoUrl, venueName, stadiumImageUrl, refereeName, onClick }: TournamentCardProps) {
  const { t } = useTranslation();

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: t('tournament.draft'), color: 'text-muted-foreground bg-muted/60' },
    upcoming: { label: t('tournament.upcoming'), color: 'text-blue-500 bg-blue-500/10' },
    live: { label: t('tournament.ongoing'), color: 'text-red-500 bg-red-500/10' },
    completed: { label: t('tournament.completed'), color: 'text-emerald-500 bg-emerald-500/10' },
  };

  const typeConfig: Record<string, { label: string; icon: JSX.Element }> = {
    knockout: { label: t('tournament.knockout'), icon: <Target className="w-3 h-3" /> },
    league: { label: t('tournament.league'), icon: <Trophy className="w-3 h-3" /> },
    groups: { label: t('tournament.groups'), icon: <Users className="w-3 h-3" /> },
  };

  const sportEmoji = sportType === 'basketball' ? '🏀' : '⚽';

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden transition-all duration-300 rounded-2xl cursor-pointer hover:shadow-lg hover:-translate-y-1',
        status === 'live' && 'ring-1 ring-primary/30',
      )}
    >
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/30">
        {stadiumImageUrl && (
          <img src={stadiumImageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

        <div className="absolute top-2.5 start-2.5 end-2.5 z-20 flex items-center justify-between">
          <Badge className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border-none backdrop-blur-md', statusConfig[status]?.color)}>
            {status === 'live' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full me-1.5 animate-pulse" />}
            {statusConfig[status]?.label}
          </Badge>
          <span className="text-sm">{sportEmoji}</span>
        </div>

        <div className="absolute -bottom-5 end-4 z-20">
          <div className="w-14 h-14 rounded-xl bg-card border-2 border-background shadow-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-7 h-7 text-primary" />
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-3.5 pt-8">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 flex-1">{name}</h3>
          <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shrink-0 ms-2">
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-primary" />{teams} {t('tournament.team')}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" />{startDate}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">{typeConfig[type]?.icon}{typeConfig[type]?.label}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {venueName ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="w-3 h-3 text-primary" />{venueName}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
          {refereeName && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Gavel className="w-3 h-3 text-primary" />{refereeName}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
