import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  activityIcon,
  type Activity,
} from '@/data/mock-data';

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
  className?: string;
}

const toneBg: Record<string, string> = {
  equipment_assigned: 'bg-info/15 text-info',
  task_started: 'bg-primary/15 text-primary',
  task_completed: 'bg-success/15 text-success',
  issue_reported: 'bg-destructive/15 text-destructive',
  maintenance_scheduled: 'bg-warning/15 text-warning',
  rental_extended: 'bg-info/15 text-info',
};

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const hrs = Math.floor(diff / 3600000);
  if (hrs >= 24) return `${Math.floor(hrs / 24)}d ago`;
  if (hrs >= 1) return `${hrs}h ago`;
  const mins = Math.floor(diff / 60000);
  return `${Math.max(1, mins)}m ago`;
}

export function ActivityTimeline({ activities, limit, className }: ActivityTimelineProps) {
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <div className={cn('relative', className)}>
      {/* vertical line */}
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
      <ul className="space-y-1">
        {items.map((a, i) => {
          const Icon = activityIcon(a.type);
          return (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative flex gap-4 rounded-lg p-2 transition-colors hover:bg-accent/40"
            >
              <div
                className={cn(
                  'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                  toneBg[a.type] ?? 'bg-accent text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(a.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">by {a.actor}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
