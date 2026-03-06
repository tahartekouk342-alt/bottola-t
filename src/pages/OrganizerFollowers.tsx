import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function OrganizerFollowers() {
  const { user } = useAuth();

  const { data: followers, isLoading } = useQuery({
    queryKey: ['my-followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: follows } = await supabase.from('user_follows').select('follower_id').eq('following_id', user.id);
      if (!follows || follows.length === 0) return [];
      const followerIds = follows.map(f => f.follower_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', followerIds);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/sport-basketball.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative p-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            المتابعون
          </h1>
          <p className="text-muted-foreground mr-15">{followers?.length || 0} شخص يتابعك</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : followers && followers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {followers.map((profile) => (
            <Card key={profile.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{profile.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{profile.display_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{profile.bio || 'مشاهد'}</p>
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
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">لا يوجد متابعون بعد</h3>
            <p className="text-muted-foreground">عندما يتابعك مشاهدون سيظهرون هنا</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
