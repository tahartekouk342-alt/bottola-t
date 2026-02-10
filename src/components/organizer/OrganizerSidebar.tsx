import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Trophy, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { ORGANIZER_BASE } from '@/lib/constants';

export function OrganizerSidebar() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate(`${ORGANIZER_BASE}`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {profile?.display_name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile?.display_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">منظم بطولات</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { navigate(`${ORGANIZER_BASE}/dashboard`); setOpen(false); }}
            >
              <Trophy className="w-5 h-5" />
              بطولاتي
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { navigate(`${ORGANIZER_BASE}/settings`); setOpen(false); }}
            >
              <Settings className="w-5 h-5" />
              الإعدادات
            </Button>

            <Separator className="my-4" />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {resolvedTheme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
