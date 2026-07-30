import { motion } from 'framer-motion';
import {
  Building2, Users, Activity, TrendingUp, CloudSun, ShieldAlert, Sparkles,
} from 'lucide-react';
import { sites } from '@/data/mock';
import { Badge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/Page';

const riskTone = { Low: 'ok', Medium: 'warn', High: 'crit' } as const;

export function SitesPage() {
  return (
    <PageContainer title="Sites">
      <PageHeader title="Sites" subtitle="Customer job sites with live utilization, demand, and AI guidance." />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {sites.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="card card-hover p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{s.name}</div>
                  <div className="text-[10px] text-ink-200">{s.location}</div>
                </div>
              </div>
              <Badge tone={riskTone[s.riskLevel]} dot={s.riskLevel === 'High'}>
                {s.riskLevel} risk
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="Machines" value={s.machines} />
              <Stat icon={<Users className="h-3.5 w-3.5" />} label="Operators" value={s.operators} />
              <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Utilization" value={`${s.utilization}%`} tone={s.utilization > 85 ? 'ok' : 'warn'} />
              <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Upcoming" value={s.upcomingDemand} small />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-ink-500/40 p-3">
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-info" />
                <div>
                  <div className="text-xs font-medium text-ink-50">{s.weather}</div>
                  <div className="text-[10px] text-ink-200">{s.weatherTemp}°F</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-ink-200">
                <ShieldAlert className="h-3.5 w-3.5" />
                Risk: {s.riskLevel}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-cat-yellow/15 bg-cat-yellow/[0.04] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-cat-yellow">
                <Sparkles className="h-3 w-3" />
                AI Suggested Action
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-100">{s.aiAction}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}

function Stat({ icon, label, value, tone, small }: { icon: React.ReactNode; label: string; value: string | number; tone?: 'ok' | 'warn'; small?: boolean }) {
  return (
    <div className="rounded-lg bg-ink-500/40 p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-200">
        {icon}
        {label}
      </div>
      <div className={`mt-0.5 font-semibold ${small ? 'text-xs text-ink-50' : 'text-base text-white'} ${tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : ''}`}>
        {value}
      </div>
    </div>
  );
}
