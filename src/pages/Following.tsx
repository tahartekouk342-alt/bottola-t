import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trophy, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { ViewerHeader } from '@/components/viewer/ViewerHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFollowing } from '@/hooks/useFollowing';

export default function Following() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { organizers, following, loadingOrganizers, loadingFollowing, follow, unfollow } = useFollowing(user?.id);

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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <ViewerHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">المتابعات</h1>
          <p className="text-muted-foreground">اكتشف وتابع منظمي البطولات</p>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              اكتشاف المنظمين
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              متابعاتي ({following?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            {loadingOrganizers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : organizers && organizers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizers.map((organizer) => (
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
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا يوجد منظمين</h3>
                  <p className="text-muted-foreground">لم يتم العثور على منظمين حتى الآن</p>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {following.map((profile) => (
                  <Card 
                    key={profile.id} 
                    className="card-interactive cursor-pointer"
                    onClick={() => navigate(`/viewer/organizer/${profile.user_id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                            {profile.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{profile.display_name}</h3>
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
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد متابعات</h3>
                  <p className="text-muted-foreground mb-4">ابدأ بمتابعة المنظمين لمشاهدة بطولاتهم</p>
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
    <Card className="card-interactive overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 ring-2 ring-primary/20">
            <AvatarImage src={organizer.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
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
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-medium">{organizer.tournament_count || 0}</span>
            <span className="text-muted-foreground">بطولة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium">{organizer.follower_count || 0}</span>
            <span className="text-muted-foreground">متابع</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); onViewTournaments(); }}>
            عرض البطولات
          </Button>
          
          {organizer.is_following ? (
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onUnfollow(); }} className="text-destructive hover:text-destructive">
              <UserMinus className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="default" size="icon" onClick={(e) => { e.stopPropagation(); onFollow(); }} className="gradient-primary">
              <UserPlus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
