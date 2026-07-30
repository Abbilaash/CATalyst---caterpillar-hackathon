import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

export function ExecutiveBrief({ brief }: { brief: any }) {
  const b = brief;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="card relative overflow-hidden p-6"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cat-yellow/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cat-yellow" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cat-yellow">
                AI Executive Brief
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
              {b.greeting} <span className="inline-block animate-pulse-soft">👋</span>
            </h1>
            <p className="mt-1 text-sm text-ink-200">
              Here's your fleet at a glance — {b.criticalDecisions} decisions need your attention.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <BriefStat label="Fleet Health" value={b.fleetHealth} suffix="%" tone="ok" />
          <BriefStat
            label="Potential Savings Today"
            value={b.potentialSavings}
            prefix="$"
            tone="cat"
          />
          <BriefStat label="Critical Decisions" value={b.criticalDecisions} tone="crit" />
          <div className="rounded-xl border border-white/[0.06] bg-ink-500/40 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-200">
              Demand Tomorrow
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-lg font-bold text-white">
              <TrendingUp className={`h-4 w-4 ${b.demandTrend === 'up' ? 'text-ok' : 'text-crit rotate-180'}`} />
              {b.demandTomorrow}
            </div>
          </div>
          <div className="rounded-xl border border-cat-yellow/20 bg-cat-yellow/[0.06] p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-cat-yellow">
              Top Recommendation
            </div>
            <div className="mt-1.5 flex items-start gap-1.5">
              <span className="text-sm font-semibold leading-snug text-white">
                {b.topRecommendation.text}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] text-ink-200">Confidence</span>
              <span className="text-xs font-bold text-cat-yellow">
                {b.topRecommendation.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BriefStat({
  label,
  value,
  prefix = '',
  suffix = '',
  tone,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  tone: 'ok' | 'cat' | 'crit';
}) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'cat' ? 'text-cat-yellow' : 'text-crit';
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-500/40 p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-ink-200">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold ${color}`}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
      </div>
    </div>
  );
}
