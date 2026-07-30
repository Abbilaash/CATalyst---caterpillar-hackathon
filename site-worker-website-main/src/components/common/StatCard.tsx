import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  delta?: number;
  deltaLabel?: string;
  footer?: ReactNode;
  className?: string;
  index?: number;
}

const toneClasses = {
  primary: { bg: 'bg-primary/15', text: 'text-primary', ring: 'ring-primary/20' },
  success: { bg: 'bg-success/15', text: 'text-success', ring: 'ring-success/20' },
  warning: { bg: 'bg-warning/15', text: 'text-warning', ring: 'ring-warning/20' },
  danger: { bg: 'bg-destructive/15', text: 'text-destructive', ring: 'ring-destructive/20' },
  info: { bg: 'bg-info/15', text: 'text-info', ring: 'ring-info/20' },
  neutral: { bg: 'bg-accent', text: 'text-muted-foreground', ring: 'ring-border' },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  delta,
  deltaLabel,
  footer,
  className,
  index = 0,
}: StatCardProps) {
  const t = toneClasses[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:shadow-black/20',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1',
            t.bg,
            t.text,
            t.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(delta !== undefined || footer) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                delta >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {delta >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          )}
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
          {footer && <span className="text-muted-foreground">{footer}</span>}
        </div>
      )}
    </motion.div>
  );
}
