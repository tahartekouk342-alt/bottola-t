import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Trophy, Calendar, Users, Loader2 } from 'lucide-react';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function OrganizerTournaments() {
  const { organizerId } = useParams<{ organizerId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?role=viewer');
  }, [user, authLoading, navigate]);

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

  if (authLoading || loadingOrganizer) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'outline' | 'destructive' | 'default' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      upcoming: { label: 'قادمة', variant: 'outline' },
      live: { label: 'جارية', variant: 'destructive' },
      completed: { label: 'منتهية', variant: 'default' }
    };
    return config[status] || config.draft;
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = { knockout: 'إقصائية', league: 'دوري', groups: 'مجموعات' };
    return config[type] || type;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ViewerHeader />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/following')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للمتابعات
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
                  <p className="text-muted-foreground">{organizer.bio || 'منظم بطولات رياضية'}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-medium">{tournaments?.length || 0}</span>
                      <span className="text-muted-foreground">بطولة</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-bold mb-4">البطولات</h2>

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
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{tournament.num_teams} فريق</span></div>
                      {tournament.start_date && (
                        <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(tournament.start_date).toLocaleDateString('ar-SA')}</span></div>
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
              <h3 className="text-lg font-semibold mb-2">لا توجد بطولات</h3>
              <p className="text-muted-foreground">هذا المنظم لم يقم بإنشاء أي بطولات بعد</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
