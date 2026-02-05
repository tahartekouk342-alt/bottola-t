import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'organizer' | 'viewer';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_organizer: boolean;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  }, []);

  const fetchRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setRole(data.role as UserRole);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchRole]);

  const signUp = async (email: string, password: string, displayName: string, selectedRole: UserRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      toast({
        title: 'خطأ في التسجيل',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    if (data.user) {
      // Add user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: selectedRole
      });

      // Update profile with is_organizer flag
      if (selectedRole === 'organizer') {
        await supabase
          .from('profiles')
          .update({ is_organizer: true })
          .eq('user_id', data.user.id);
      }

      toast({
        title: 'تم التسجيل بنجاح',
        description: 'يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب'
      });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }

    toast({
      title: 'مرحباً بك!',
      description: 'تم تسجيل الدخول بنجاح'
    });

    return { error: null, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    navigate('/');
  };

  return {
    user,
    session,
    profile,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    isOrganizer: role === 'organizer',
    isViewer: role === 'viewer'
  };
}
