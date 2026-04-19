import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Trophy, Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function OrganizerTournaments() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const { organizerId } = useParams<{ organizerId: string }>();
  const navigate = useNavigate();

  const { data: organizer, isLoading: loadingOrganizer } = useQuery({
    queryKey: ['organizer', organizerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', organizerId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId
  });

  const { data: tournaments, isLoading: loadingTournaments } = useQuery({
    queryKey: ['organizer-tournaments', organizerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments').select('*').eq('owner_id', organizerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId
  });

  if (loadingOrganizer) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { key: string; variant: 'secondary' | 'outline' | 'destructive' | 'default' }> = {
      draft: { key: 'tournament.draft', variant: 'secondary' },
      upcoming: { key: 'tournament.upcoming', variant: 'outline' },
      live: { key: 'tournament.ongoing', variant: 'destructive' },
      completed: { key: 'tournament.completed', variant: 'default' }
    };
    return config[status] || config.draft;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      knockout: t('tournament.knockout'),
      league: t('tournament.league'),
      groups: t('tournament.groupsKnockout'),
    };
    return config[type] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={dir}>
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/following')}>
        <BackIcon className="w-4 h-4 me-2" />
        {t('following.backToFollowing')}
      </Button>

      {organizer && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                <AvatarImage src={organizer.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{organizer.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-display font-bold mb-1">{organizer.display_name}</h1>
                <p className="text-muted-foreground">{organizer.bio || t('following.organizerOf')}</p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-medium">{tournaments?.length || 0}</span>
                    <span className="text-muted-foreground">{t('following.tournamentCount')}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-bold mb-4">{t('following.tournamentsTitle')}</h2>

      {loadingTournaments ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => {
            const statusConfig = getStatusBadge(tournament.status);
            return (
              <Card key={tournament.id} className="card-interactive cursor-pointer" onClick={() => navigate(`/viewer/tournament/${tournament.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{tournament.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">{getTypeBadge(tournament.type)}</Badge>
                    </div>
                    <Badge variant={statusConfig.variant}>{t(statusConfig.key)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{tournament.num_teams} {t('tournament.team')}</span></div>
                    {tournament.start_date && (
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(tournament.start_date).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'ar-SA')}</span></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('tournament.noTournaments')}</h3>
            <p className="text-muted-foreground">{t('following.noTournamentsByOrganizer')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
