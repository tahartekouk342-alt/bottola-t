import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TournamentCard } from '@/components/tournament/TournamentCard';
import { supabase } from '@/integrations/supabase/client';

export default function ViewerTournamentsFeed() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const localeStr = i18n.language === 'fr' ? 'fr-FR' : 'ar-SA';

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['all-tournaments-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ownerIds = [...new Set((data || []).map(t => t.owner_id).filter(Boolean))];
      let profileMap = new Map();
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', ownerIds as string[]);
        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      const tournamentIds = (data || []).map(t => t.id);
      const teamCountMap = new Map<string, number>();
      if (tournamentIds.length > 0) {
        const { data: teams } = await supabase.from('teams').select('tournament_id').in('tournament_id', tournamentIds);
        if (teams) teams.forEach(t => teamCountMap.set(t.tournament_id, (teamCountMap.get(t.tournament_id) || 0) + 1));
      }

      return (data || []).map(t => ({
        ...t,
        organizer: profileMap.get(t.owner_id || '') || null,
        teamCount: teamCountMap.get(t.id) || t.num_teams,
      }));
    },
  });

  const filtered = tournaments?.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.organizer?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const mapStatus = (s: string) => {
    if (s === 'live') return 'live' as const;
    if (s === 'completed') return 'completed' as const;
    return 'upcoming' as const;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">{t('nav.tournaments')}</h1>
        <p className="text-muted-foreground">{t('tournament.browseAll')}</p>
      </div>
      <div className="relative mb-8 max-w-md">
        <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder={t('tournament.searchPlaceholder')} className="pe-12 rounded-2xl bg-secondary/40 border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              id={tournament.id}
              name={tournament.name}
              teams={tournament.teamCount}
              startDate={tournament.start_date ? new Date(tournament.start_date).toLocaleDateString(localeStr) : t('tournament.noDate')}
              status={mapStatus(tournament.status)}
              type={tournament.type}
              logoUrl={tournament.logo_url}
              venueName={tournament.venue_name}
              stadiumImageUrl={tournament.venue_photos?.[0]}
              refereeName={(tournament as any).referee_name}
              sportType={(tournament as any).sport_type || 'football'}
              onClick={() => navigate(`/viewer/tournament/${tournament.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-2xl font-display font-bold mb-2">{t('tournament.noTournaments')}</h3>
            <p className="text-muted-foreground">{t('tournament.noTournamentsDesc')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
