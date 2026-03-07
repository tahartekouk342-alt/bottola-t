import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Users, Bell, Settings, User, LogOut, Camera, Save, Loader2, Trophy, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function ViewerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { resolvedTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState(user ? 'menu' : 'welcome');

  // Profile edit state
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      toast({ title: 'تم رفع الصورة بنجاح' });
    } catch (error: any) {
      toast({ title: 'خطأ في رفع الصورة', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ display_name: displayName, bio, avatar_url: avatarUrl }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'تم حفظ الملف الشخصي ✅' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate('/');
  };

  const navItems = [
    { label: 'المتابعات', href: '/following', icon: Users },
    { label: 'الإشعارات', href: '/notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary/50">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 bg-card border-l border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {profile?.display_name?.charAt(0) || <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile?.display_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">مشاهد</p>
              </div>
            </div>
          </div>

          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
            <TabsList className={cn('mx-4 mt-3', user ? 'grid grid-cols-2' : 'hidden')}>
              <TabsTrigger value="menu">القائمة</TabsTrigger>
              <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            </TabsList>

            <TabsContent value="menu" className="flex-1 overflow-y-auto p-4 space-y-2 mt-0">
              {/* Home */}
              <Button
                variant={location.pathname === '/home' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 h-12"
                onClick={() => { navigate('/home'); setOpen(false); }}
              >
                <Home className="w-5 h-5" />
                الرئيسية
              </Button>

              {/* Tournaments */}
              <Button
                variant={location.pathname === '/tournaments-feed' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 h-12"
                onClick={() => { navigate('/tournaments-feed'); setOpen(false); }}
              >
                <Trophy className="w-5 h-5" />
                البطولات
              </Button>

              {/* Notifications */}
              <Button
                variant={location.pathname === '/notifications' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 h-12"
                onClick={() => { navigate('/notifications'); setOpen(false); }}
              >
                <Bell className="w-5 h-5" />
                الإشعارات
                {unreadCount > 0 && (
                  <Badge className="mr-auto gradient-primary text-primary-foreground border-0 h-5 min-w-[20px] flex items-center justify-center text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {navItems.filter(item => item.label !== 'الإشعارات').map((item) => (
                <Button
                  key={item.href}
                  variant={location.pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => { navigate(item.href); setOpen(false); }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.badge ? (
                    <Badge className="mr-auto gradient-primary text-primary-foreground border-0 h-5 min-w-[20px] flex items-center justify-center text-xs">
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  ) : null}
                </Button>
              ))}

              <Separator className="my-4" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => { navigate('/settings'); setOpen(false); }}
              >
                <Settings className="w-5 h-5" />
                الإعدادات
              </Button>

              <Separator className="my-4" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </Button>
            </TabsContent>

            <TabsContent value="welcome" className="flex-1 flex flex-col items-center justify-center p-4 space-y-4 mt-0">
              <div className="text-center space-y-3">
                <Trophy className="w-12 h-12 text-primary mx-auto" />
                <h3 className="font-bold text-lg">مرحباً بك في Bottola</h3>
                <p className="text-sm text-muted-foreground">تابع البطولات والمباريات لحظة بلحظة</p>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground rounded-xl h-12"
                onClick={() => { navigate('/auth?role=viewer'); setOpen(false); }}
              >
                ابدأ الآن
              </Button>
            </TabsContent>

            {user && <TabsContent value="profile" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {displayName?.charAt(0) || 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full gradient-primary flex items-center justify-center cursor-pointer shadow-lg">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
                  </label>
                </div>
                {uploading && <p className="text-xs text-muted-foreground">جاري الرفع...</p>}
              </div>

              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="اسمك" />
              </div>

              <div className="space-y-2">
                <Label>نبذة عنك</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة مختصرة..." rows={3} />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ
              </Button>
            </TabsContent>}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
