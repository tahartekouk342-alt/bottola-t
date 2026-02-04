import { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Trophy,
  Calendar,
  Users,
  GitBranch,
  TableIcon,
  Home,
  ListOrdered,
} from 'lucide-react';

interface TournamentSidebarProps {
  tournamentId?: string;
  tournamentName?: string;
  tournamentType?: 'knockout' | 'league' | 'groups';
}

const mainNavItems = [
  { title: 'الرئيسية', url: '/', icon: Home },
  { title: 'البطولات', url: '/tournaments', icon: Trophy },
  { title: 'المباريات', url: '/matches', icon: Calendar },
  { title: 'الترتيب', url: '/standings', icon: ListOrdered },
];

export function TournamentSidebar({
  tournamentId,
  tournamentName,
  tournamentType,
}: TournamentSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const tournamentNavItems = tournamentId
    ? [
        {
          title: 'شجرة البطولة',
          url: `/tournament/${tournamentId}?tab=bracket`,
          icon: GitBranch,
          tab: 'bracket',
        },
        {
          title: 'المباريات',
          url: `/tournament/${tournamentId}?tab=matches`,
          icon: Calendar,
          tab: 'matches',
        },
        {
          title: 'الفرق',
          url: `/tournament/${tournamentId}?tab=teams`,
          icon: Users,
          tab: 'teams',
        },
        ...(tournamentType === 'league' || tournamentType === 'groups'
          ? [
              {
                title: 'الترتيب',
                url: `/tournament/${tournamentId}?tab=standings`,
                icon: TableIcon,
                tab: 'standings',
              },
            ]
          : []),
      ]
    : [];

  const isMainActive = (path: string) => location.pathname === path;
  const isTournamentActive = (tab: string) => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === tab;
  };

  return (
    <Sidebar
      className={collapsed ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <div className="p-3 border-b border-border">
        <SidebarTrigger className="w-full justify-start" />
      </div>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            التنقل الرئيسي
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50"
                      activeClassName="bg-primary text-primary-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tournament Navigation */}
        {tournamentId && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
              {tournamentName || 'البطولة الحالية'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {tournamentNavItems.map((item) => (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50 ${
                          isTournamentActive(item.tab)
                            ? 'bg-primary/10 text-primary font-medium'
                            : ''
                        }`}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
