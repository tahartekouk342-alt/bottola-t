import { Trophy, Bell, LogOut, ArrowRight, Settings, Moon, Sun, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/components/theme/ThemeProvider';
import { ORGANIZER_BASE } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OrganizerHeader() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`${ORGANIZER_BASE}`);
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Back Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-secondary/50"
              onClick={() => navigate(-1)}
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Link to={`${ORGANIZER_BASE}/dashboard`} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary transition-transform duration-300 group-hover:scale-105">
                <Trophy className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
                <span className="text-xs text-muted-foreground font-semibold">لوحة تحكم المنظم</span>
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-secondary/50"
              onClick={() => navigate('/')}
              title="الرئيسية"
            >
              <Home className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-secondary/50"
              onClick={() => navigate(`${ORGANIZER_BASE}/notifications`)}
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
            </Button>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl hover:bg-secondary/50"
                  title="الإعدادات"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                {/* Theme Toggle */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">المظهر</span>
                  <div className="flex gap-1">
                    <Button
                      variant={theme === 'light' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg h-8 w-8 p-0"
                      onClick={() => setTheme('light')}
                      title="وضع فاتح"
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg h-8 w-8 p-0"
                      onClick={() => setTheme('dark')}
                      title="وضع داكن"
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Home Link */}
                <DropdownMenuItem
                  onClick={() => navigate('/')}
                  className="rounded-lg py-3 px-4 font-bold cursor-pointer hover:bg-primary/10 transition-all"
                >
                  <Home className="ml-3 h-4 w-4" />
                  الرئيسية
                </DropdownMenuItem>

                {/* Settings Link */}
                <DropdownMenuItem
                  onClick={() => navigate(`${ORGANIZER_BASE}/settings`)}
                  className="rounded-lg py-3 px-4 font-bold cursor-pointer hover:bg-primary/10 transition-all"
                >
                  <Settings className="ml-3 h-4 w-4" />
                  إعدادات الحساب
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="rounded-lg py-3 px-4 font-bold cursor-pointer text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <LogOut className="ml-3 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
