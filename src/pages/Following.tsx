import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Trophy, UserPlus, UserMinus, Loader2, Search, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFollowing } from '@/hooks/useFollowing';
import { useToast } from '@/hooks/use-toast';

export default function Following() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { organizers, following, loadingOrganizers, loadingFollowing, follow, unfollow } = useFollowing(user?.id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrganizers = organizers?.filter(org =>
    org.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.bio && org.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFollow = (organizerId: string) => {
    if (!user) {
      toast({ title: t('common.loginRequired'), description: t('following.loginToFollowDesc'), variant: 'destructive' });
      navigate('/auth?role=viewer');
      return;
    }
    follow(organizerId);
  };

  return (
    <div className="container mx-auto px-4 py-8" dir={dir}>
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/sport-basketball.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative p-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            {t('following.title')}
          </h1>
          <p className="text-muted-foreground ms-15">{t('following.subtitle')}</p>
        </div>
      </div>

      {!user && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <LogIn className="w-8 h-8 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">{t('following.loginToFollow')}</p>
              <p className="text-xs text-muted-foreground">{t('following.loginToFollowDesc')}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/auth?role=viewer')} className="gradient-primary text-primary-foreground rounded-xl">
              {t('nav.login')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-secondary/50 p-1">
          <TabsTrigger value="discover" className="flex items-center gap-2 rounded-xl">
            <Users className="w-4 h-4" />{t('following.discover')}
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2 rounded-xl" disabled={!user}>
            <UserPlus className="w-4 h-4" />{t('following.myFollowing')} ({following?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder={t('following.searchOrganizer')} className="pe-12 rounded-2xl bg-secondary/40 border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {loadingOrganizers ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredOrganizers && filteredOrganizers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizers.map((organizer) => (
                <OrganizerCard
                  key={organizer.id}
                  organizer={organizer}
                  onFollow={() => handleFollow(organizer.user_id)}
                  onUnfollow={() => user && unfollow(organizer.user_id)}
                  onViewTournaments={() => navigate(`/viewer/organizer/${organizer.user_id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">
                  {searchQuery ? t('following.noResults') : t('following.noOrganizers')}
                </h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following">
          {loadingFollowing ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : following && following.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {following.map((profile) => (
                <Card key={profile.id} className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden" onClick={() => navigate(`/viewer/organizer/${profile.user_id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{profile.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{profile.display_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{profile.bio || t('following.organizerOf')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <UserPlus className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">{t('following.noFollowing')}</h3>
                <p className="text-muted-foreground">{t('following.startFollowing')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OrganizerCardProps {
  organizer: {
    id: string; user_id: string; display_name: string; bio: string | null;
    avatar_url: string | null; tournament_count?: number; follower_count?: number; is_following?: boolean;
  };
  onFollow: () => void;
  onUnfollow: () => void;
  onViewTournaments: () => void;
}

function OrganizerCard({ organizer, onFollow, onUnfollow, onViewTournaments }: OrganizerCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-all group">
      <div className="h-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/images/sport-volleyball.jpg)', backgroundSize: 'cover' }} />
      </div>
      <CardContent className="p-5 -mt-8 relative">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 ring-3 ring-background shadow-lg">
            <AvatarImage src={organizer.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{organizer.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 mt-4">
            <h3 className="font-bold text-lg truncate">{organizer.display_name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{organizer.bio || t('following.organizerOf')}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm mb-4 px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-bold">{organizer.tournament_count || 0}</span>
            <span className="text-muted-foreground">{t('following.tournamentCount')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-bold">{organizer.follower_count || 0}</span>
            <span className="text-muted-foreground">{t('following.followerCount')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={(e) => { e.stopPropagation(); onViewTournaments(); }}>{t('following.viewTournaments')}</Button>
          {organizer.is_following ? (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onUnfollow(); }} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
              <UserMinus className="w-5 h-5" />
            </Button>
          ) : (
            <Button size="icon" onClick={(e) => { e.stopPropagation(); onFollow(); }} className="gradient-primary text-primary-foreground rounded-xl">
              <UserPlus className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
