import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function ViewerTournamentsFeed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?role=viewer');
  }, [user, authLoading, navigate]);

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['followed-tournaments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: follows } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
      if (!follows || follows.length === 0) return [];
      const followingIds = follows.map(f => f.following_id);
      const { data: tournamentsData, error } = await supabase.from('tournaments').select('*').in('owner_id', followingIds).order('created_at', { ascending: false });
      if (error) throw error;
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', followingIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return (tournamentsData || []).map(t => ({ ...t, organizer: profileMap.get(t.owner_id || '') || null }));
    },
    enabled: !!user?.id
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'secondary' | 'outline' | 'destructive' | 'default' }> = {
      draft: { label: 'مسودة', variant: 'secondary' }, upcoming: { label: 'قادمة', variant: 'outline' },
      live: { label: 'جارية', variant: 'destructive' }, completed: { label: 'منتهية', variant: 'default' }
    };
    return config[status] || config.draft;
  };
  const getTypeBadge = (type: string) => ({ knockout: 'إقصائية', league: 'دوري', groups: 'مجموعات' }[type] || type);

  const filtered = tournaments?.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.organizer?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">البطولات</h1>
        <p className="text-muted-foreground">بطولات المنظمين الذين تتابعهم</p>
      </div>
      <div className="relative mb-8 max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input placeholder="ابحث عن بطولة أو منظم..." className="pr-12 rounded-2xl bg-secondary/40 border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tournament) => {
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{tournament.num_teams} فريق</span></div>
                    {tournament.start_date && (
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(tournament.start_date).toLocaleDateString('ar-SA')}</span></div>
                    )}
                  </div>
                  {tournament.organizer && (
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={tournament.organizer.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{tournament.organizer.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{tournament.organizer.display_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-2xl font-display font-bold mb-2">لا توجد بطولات</h3>
            <p className="text-muted-foreground">تابع منظمين لرؤية بطولاتهم هنا</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
