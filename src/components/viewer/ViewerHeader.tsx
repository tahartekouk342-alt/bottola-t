import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ViewerSidebar } from '@/components/viewer/ViewerSidebar';

export function ViewerHeader() {
  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/following" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary transition-transform duration-300 group-hover:scale-105">
              <Trophy className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
          </Link>

          <ViewerSidebar />
        </div>
      </div>
    </header>
  );
}
