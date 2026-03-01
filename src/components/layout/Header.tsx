import { Trophy, Menu, X, LogIn, LogOut, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { label: 'الرئيسية', href: '/' },
  { label: 'البطولات', href: '/tournaments' },
  { label: 'المباريات', href: '/matches' },
  { label: 'الترتيب', href: '/standings' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserRole(session.user.id), 0);
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setUserRole(data?.role || null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
      scrolled 
        ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-2xl" 
        : "bg-transparent py-6"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-3xl font-black text-foreground tracking-tighter uppercase">
              Bottola
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user && userRole === 'viewer' && (
              <Link
                to="/following"
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                  location.pathname === '/following'
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                متابعاتي
              </Link>
            )}
          </nav>

          {/* Theme Toggle & Auth */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/5">
               <ThemeToggle />
               <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-primary transition-colors">
                  <Bell className="w-5 h-5" />
               </Button>
            </div>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-2xl p-0 overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-black text-xl">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                  <div className="flex flex-col space-y-1 p-4 mb-2 rounded-xl bg-white/5">
                    <p className="text-sm font-black text-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                         {userRole === 'organizer' ? 'منظم معتمد' : 'مشاهد نشط'}
                       </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <div className="p-1 space-y-1">
                    {userRole === 'organizer' && (
                      <DropdownMenuItem onClick={() => navigate('/tournaments')} className="rounded-lg py-3 px-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-all">
                        <Trophy className="ml-3 h-4 w-4" />
                        لوحة تحكم المنظم
                      </DropdownMenuItem>
                    )}
                    {userRole === 'viewer' && (
                      <DropdownMenuItem onClick={() => navigate('/following')} className="rounded-lg py-3 px-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-all">
                        <User className="ml-3 h-4 w-4" />
                        البطولات المتابعة
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut} className="rounded-lg py-3 px-4 font-bold cursor-pointer text-red-400 hover:bg-red-400/10 transition-all">
                      <LogOut className="ml-3 h-4 w-4" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="rounded-2xl gradient-primary text-primary-foreground font-black uppercase tracking-widest px-8 h-12 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="w-4 h-4 ml-3" />
                دخول
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-8 space-y-6 animate-fade-in-up">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest transition-all duration-300",
                    location.pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-6 border-t border-white/5 px-4 flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                 <span className="font-bold text-sm text-muted-foreground">المظهر</span>
                 <ThemeToggle />
              </div>
              {user ? (
                <Button 
                  variant="destructive"
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5 ml-3" />
                  تسجيل الخروج
                </Button>
              ) : (
                <Button 
                  className="w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  <LogIn className="w-5 h-5 ml-3" />
                  تسجيل الدخول
                </Button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
