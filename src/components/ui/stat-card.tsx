import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ icon: Icon, label, value, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "p-5 rounded-xl bg-card border border-border",
      "hover:border-primary/50 hover:shadow-glow transition-all duration-300",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? "text-primary" : "text-destructive"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
