import { cn } from '@/lib/utils';
import {
  CircleDot,
  Circle,
  Wrench,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Timer,
  ArrowUpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

interface StatusConfig {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-accent/60 text-foreground border-border',
  primary: 'bg-primary/15 text-primary border-primary/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-info/15 text-info border-info/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

const dotStyles: Record<Tone, string> = {
  neutral: 'bg-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground',
};

// Map of status label -> config
const statusMap: Record<string, StatusConfig> = {
  // Machine / rental statuses
  Working: { label: 'Working', tone: 'success', icon: CircleDot },
  Idle: { label: 'Idle', tone: 'warning', icon: Timer },
  Maintenance: { label: 'Maintenance', tone: 'info', icon: Wrench },
  'On Maintenance': { label: 'On Maintenance', tone: 'info', icon: Wrench },
  Transport: { label: 'Transport', tone: 'primary', icon: Truck },
  Available: { label: 'Available', tone: 'success', icon: CheckCircle2 },
  Offline: { label: 'Offline', tone: 'muted', icon: Circle },
  Active: { label: 'Active', tone: 'success', icon: CircleDot },

  // Task statuses
  'In Progress': { label: 'In Progress', tone: 'info', icon: Clock },
  Pending: { label: 'Pending', tone: 'neutral', icon: Clock },
  Completed: { label: 'Completed', tone: 'success', icon: CheckCircle2 },
  Delayed: { label: 'Delayed', tone: 'danger', icon: AlertTriangle },
  'On Hold': { label: 'On Hold', tone: 'warning', icon: PauseCircle },

  // Shift statuses
  'On Shift': { label: 'On Shift', tone: 'success', icon: CircleDot },
  'Off Shift': { label: 'Off Shift', tone: 'muted', icon: Circle },
  Break: { label: 'Break', tone: 'warning', icon: PauseCircle },
  'Off Sick': { label: 'Off Sick', tone: 'danger', icon: XCircle },

  // Availability
  'On Task': { label: 'On Task', tone: 'info', icon: Clock },
  Unavailable: { label: 'Unavailable', tone: 'muted', icon: XCircle },

  // Maintenance statuses
  Scheduled: { label: 'Scheduled', tone: 'primary', icon: Clock },
  Overdue: { label: 'Overdue', tone: 'danger', icon: AlertTriangle },
  Requested: { label: 'Requested', tone: 'warning', icon: ArrowUpCircle },
};

const priorityMap: Record<string, StatusConfig> = {
  Critical: { label: 'Critical', tone: 'danger', icon: AlertTriangle },
  High: { label: 'High', tone: 'warning', icon: ArrowUpCircle },
  Medium: { label: 'Medium', tone: 'info', icon: CircleDot },
  Low: { label: 'Low', tone: 'muted', icon: Circle },
};

interface StatusChipProps {
  status: string;
  variant?: 'status' | 'priority';
  showIcon?: boolean;
  className?: string;
}

export function StatusChip({
  status,
  variant = 'status',
  showIcon = true,
  className,
}: StatusChipProps) {
  const config =
    variant === 'priority'
      ? priorityMap[status] ?? { label: status, tone: 'neutral' as Tone, icon: Circle }
      : statusMap[status] ?? { label: status, tone: 'neutral' as Tone, icon: Circle };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        toneStyles[config.tone],
        className
      )}
    >
      {showIcon ? (
        Icon ? (
          <Icon className="h-3 w-3" />
        ) : null
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[config.tone])} />
      )}
      {config.label}
    </span>
  );
}
