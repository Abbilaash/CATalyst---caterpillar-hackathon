import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

export function KPICard({
  label,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  delta,
  trend,
  currency = false,
  delay = 0,
  accent = false,
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  currency?: boolean;
  delay?: number;
  accent?: boolean;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-ok' : trend === 'down' ? 'text-crit' : 'text-ink-200';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`card card-hover relative overflow-hidden p-5 ${accent ? 'border-cat-yellow/20' : ''}`}
    >
      {accent && (
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-cat-yellow/10 blur-2xl" />
      )}
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-200">{label}</div>
        <div className="mt-2 flex items-end gap-2">
          <AnimatedCounter
            value={value}
            decimals={decimals}
            prefix={currency ? '$' : prefix}
            suffix={suffix}
            className={`text-2xl font-bold ${accent ? 'text-cat-yellow' : 'text-white'}`}
          />
        </div>
        {delta !== undefined && (
          <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>
              {delta > 0 ? '+' : ''}
              {currency && '$'}
              {delta}
              {suffix === '%' ? ' pts' : ''}
            </span>
            <span className="text-ink-200">vs yesterday</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
