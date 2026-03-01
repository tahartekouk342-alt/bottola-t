import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trophy, UserPlus, UserMinus, Loader2, Search } from 'lucide-react';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFollowing } from '@/hooks/useFollowing';

export default function Following() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { organizers, following, loadingOrganizers, loadingFollowing, follow, unfollow } = useFollowing(user?.id);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?role=viewer');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredOrganizers = organizers?.filter(org =>
    org.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (org.bio && org.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ViewerHeader />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">المتابعات</h1>
          <p className="text-muted-foreground text-lg">اكتشف وتابع منظمي البطولات</p>
        </div>

        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-secondary/50 p-1">
            <TabsTrigger value="discover" className="flex items-center gap-2 rounded-xl">
              <Users className="w-4 h-4" />
              اكتشاف المنظمين
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2 rounded-xl">
              <UserPlus className="w-4 h-4" />
              متابعاتي ({following?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            {/* Search */}
            <div className="relative mb-8 max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن منظم..."
                className="pr-12 rounded-2xl bg-secondary/40 border-white/10 input-enhanced"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingOrganizers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredOrganizers && filteredOrganizers.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrganizers.map((organizer) => (
                  <OrganizerCard
                    key={organizer.id}
                    organizer={organizer}
                    onFollow={() => follow(organizer.user_id)}
                    onUnfollow={() => unfollow(organizer.user_id)}
                    onViewTournaments={() => navigate(`/viewer/organizer/${organizer.user_id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed rounded-3xl border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-2xl font-display font-bold mb-2">
                    {searchQuery ? 'لم يتم العثور على نتائج' : 'لا يوجد منظمين'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'جرب كلمة بحث مختلفة' : 'لم يتم العثور على منظمين حتى الآن'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="following">
            {loadingFollowing ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : following && following.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {following.map((profile) => (
                  <Card 
                    key={profile.id} 
                    className="card-interactive cursor-pointer rounded-3xl"
                    onClick={() => navigate(`/viewer/organizer/${profile.user_id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                            {profile.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{profile.display_name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {profile.bio || 'منظم بطولات'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed rounded-3xl border-white/10">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <UserPlus className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-2xl font-display font-bold mb-2">لا توجد متابعات</h3>
                  <p className="text-muted-foreground mb-6">ابدأ بمتابعة المنظمين لمشاهدة بطولاتهم</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface OrganizerCardProps {
  organizer: {
    id: string;
    user_id: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    tournament_count?: number;
    follower_count?: number;
    is_following?: boolean;
  };
  onFollow: () => void;
  onUnfollow: () => void;
  onViewTournaments: () => void;
}

function OrganizerCard({ organizer, onFollow, onUnfollow, onViewTournaments }: OrganizerCardProps) {
  return (
    <Card className="card-interactive overflow-hidden rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 ring-2 ring-primary/20">
            <AvatarImage src={organizer.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {organizer.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{organizer.display_name}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {organizer.bio || 'منظم بطولات رياضية'}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-bold">{organizer.tournament_count || 0}</span>
            <span className="text-muted-foreground">بطولة</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-bold">{organizer.follower_count || 0}</span>
            <span className="text-muted-foreground">متابع</span>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 rounded-2xl border-white/10 hover:bg-secondary/50" 
            onClick={(e) => { e.stopPropagation(); onViewTournaments(); }}
          >
            عرض البطولات
          </Button>
          
          {organizer.is_following ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { e.stopPropagation(); onUnfollow(); }} 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-2xl"
            >
              <UserMinus className="w-5 h-5" />
            </Button>
          ) : (
            <Button 
              size="icon" 
              onClick={(e) => { e.stopPropagation(); onFollow(); }} 
              className="btn-primary rounded-2xl"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
