import { Trophy, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ViewerHeader() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary transition-transform duration-300 group-hover:scale-105">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl hover:bg-secondary/50"
              onClick={() => navigate('/notifications')}
              title="الإشعارات"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
