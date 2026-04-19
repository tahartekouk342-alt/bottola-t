import { Trophy, Users, Bell, LogOut, Moon, Sun, User, Settings, LogIn, Home, Newspaper } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/components/theme/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';

export function ViewerAppSidebar() {
  const { t } = useTranslation();
  const { state, toggleSidebar, isMobile } = useSidebar();
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

  const handleNavClick = () => { if (isMobile) toggleSidebar(); };

  const publicItems = [
    { title: t('nav.home'), url: '/home', icon: Home },
    { title: t('nav.tournaments'), url: '/tournaments-feed', icon: Trophy },
    { title: t('nav.newsFeed'), url: '/news-feed', icon: Newspaper },
  ];

  const authItems = [
    { title: t('nav.following'), url: '/following', icon: Users },
    { title: t('nav.notifications'), url: '/notifications', icon: Bell },
    { title: t('nav.settings'), url: '/settings', icon: Settings },
  ];

  const navItems = user ? [...publicItems, ...authItems] : publicItems;

  return (
    <Sidebar collapsible="icon" side={document.documentElement.dir === 'rtl' ? 'right' : 'left'}>
      <SidebarContent>
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {profile?.display_name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{profile?.display_name || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{t('roles.viewer')}</p>
                </div>
              </div>
            ) : (
              <Button onClick={() => { navigate('/auth?role=viewer'); handleNavClick(); }}
                className="w-full gradient-primary text-primary-foreground rounded-lg gap-2">
                <LogIn className="w-4 h-4" /> {t('nav.startNow')}
              </Button>
            )}
          </div>
        )}

        {collapsed && !user && (
          <div className="p-2">
            <Button size="icon" onClick={() => { navigate('/auth?role=viewer'); handleNavClick(); }} className="w-full gradient-primary text-primary-foreground">
              <LogIn className="w-4 h-4" />
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} onClick={handleNavClick}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="ms-2 h-5 w-5" />
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
            <SidebarMenuButton onClick={() => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); handleNavClick(); }}>
              {resolvedTheme === 'dark' ? <Sun className="ms-2 h-5 w-5" /> : <Moon className="ms-2 h-5 w-5" />}
              {!collapsed && <span>{resolvedTheme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user && (
            <>
              <Separator />
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => { handleSignOut(); handleNavClick(); }} className="text-destructive hover:text-destructive">
                  <LogOut className="ms-2 h-5 w-5" />
                  {!collapsed && <span>{t('nav.logout')}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
