import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organizer {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_organizer: boolean;
  tournament_count?: number;
  follower_count?: number;
  is_following?: boolean;
}

export function useFollowing(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all organizers with stats in fewer queries
  const { data: organizers, isLoading: loadingOrganizers } = useQuery({
    queryKey: ['organizers', userId],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_organizer', true);

      if (error) throw error;
      if (!profiles || profiles.length === 0) return [];

      // Get all tournament counts in one query
      const userIds = profiles.map(p => p.user_id);
      
      // Get follow data for current user
      let followingIds: string[] = [];
      if (userId) {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);
        followingIds = (follows || []).map(f => f.following_id);
      }

      const organizersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          const { count: tournamentCount } = await supabase
            .from('tournaments')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', profile.user_id);

          const { count: followerCount } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.user_id);

          return {
            ...profile,
            tournament_count: tournamentCount || 0,
            follower_count: followerCount || 0,
            is_following: followingIds.includes(profile.user_id)
          } as Organizer;
        })
      );

      return organizersWithStats;
    },
    enabled: true
  });

  // Fetch users I'm following
  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      const followingIds = data.map(f => f.following_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', followingIds);
      
      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!userId
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (organizerId: string) => {
      if (!userId) throw new Error('يجب تسجيل الدخول أولاً');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: userId,
          following_id: organizerId
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('أنت تتابع هذا المنظم بالفعل');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast({
        title: 'تم المتابعة ✅',
        description: 'تمت إضافة المنظم إلى قائمة متابعاتك'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (organizerId: string) => {
      if (!userId) throw new Error('يجب تسجيل الدخول أولاً');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', organizerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast({
        title: 'تم إلغاء المتابعة',
        description: 'تمت إزالة المنظم من قائمة متابعاتك'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    organizers,
    following,
    loadingOrganizers,
    loadingFollowing,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending
  };
}
