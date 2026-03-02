import { Trophy, Users, Bell, LogOut, Moon, Sun, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/theme/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { title: 'البطولات', url: '/home', icon: Trophy },
  { title: 'المتابعات', url: '/following', icon: Users },
  { title: 'الإشعارات', url: '/notifications', icon: Bell },
];

export function ViewerAppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { resolvedTheme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent>
        {/* Profile */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {profile?.display_name?.charAt(0) || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{profile?.display_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">مشاهد</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>القائمة</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="ml-2 h-5 w-5" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {!collapsed && item.url === '/notifications' && unreadCount > 0 && (
                        <Badge className="gradient-primary text-primary-foreground border-0 h-5 min-w-[20px] flex items-center justify-center text-xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              {resolvedTheme === 'dark' ? <Sun className="ml-2 h-5 w-5" /> : <Moon className="ml-2 h-5 w-5" />}
              {!collapsed && <span>{resolvedTheme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator />
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:text-destructive">
              <LogOut className="ml-2 h-5 w-5" />
              {!collapsed && <span>تسجيل الخروج</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
