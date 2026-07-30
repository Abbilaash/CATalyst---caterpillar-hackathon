import type { ReactNode } from 'react';

type Tone = 'neutral' | 'cat' | 'ok' | 'warn' | 'crit' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-500/60 text-ink-100 border-white/5',
  cat: 'bg-cat-yellow/10 text-cat-yellow border-cat-yellow/20',
  ok: 'bg-ok/10 text-ok border-ok/20',
  warn: 'bg-warn/10 text-warn border-warn/20',
  crit: 'bg-crit/10 text-crit border-crit/20',
  info: 'bg-info/10 text-info border-info/20',
};

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft" />}
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'working': return 'ok';
    case 'idle': return 'warn';
    case 'critical': return 'crit';
    case 'maintenance': return 'info';
    case 'transit': return 'neutral';
    default: return 'neutral';
  }
}

export function priorityTone(p: string): Tone {
  switch (p) {
    case 'high': return 'crit';
    case 'medium': return 'warn';
    case 'low': return 'info';
    default: return 'neutral';
  }
}
