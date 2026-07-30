import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'auto' | 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showLabel = false,
  size = 'md',
  tone = 'auto',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const autoTone =
    pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-primary' : pct >= 25 ? 'bg-warning' : 'bg-destructive';

  const toneClass =
    tone === 'auto'
      ? autoTone
      : {
          primary: 'bg-primary',
          success: 'bg-success',
          warning: 'bg-warning',
          danger: 'bg-destructive',
        }[tone];

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-muted', heightClass)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', toneClass, barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-xs text-muted-foreground">{Math.round(pct)}%</div>
      )}
    </div>
  );
}
