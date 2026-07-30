import { motion } from 'framer-motion';
import { Trophy, Shield, Zap, Clock, AlertCircle, HardHat } from 'lucide-react';
import { operators } from '@/data/mock';
import { Badge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/Page';

export function WorkforcePage() {
  const top3 = operators.slice(0, 3);
  const rest = operators.slice(3);

  return (
    <PageContainer title="Workforce">
      <PageHeader title="Workforce" subtitle="Operator performance, safety, and efficiency leaderboard." />

      {/* Podium */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {top3.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -3 }}
            className={`card card-hover relative overflow-hidden p-5 ${i === 0 ? 'border-cat-yellow/30' : ''}`}
          >
            {i === 0 && (
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cat-yellow/15 blur-2xl" />
            )}
            <div className="relative flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold ${i === 0 ? 'bg-cat-yellow text-ink-900' : 'bg-ink-500/60 text-ink-50'}`}>
                {o.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{o.name}</span>
                  {i === 0 && <Trophy className="h-4 w-4 text-cat-yellow" />}
                </div>
                <div className="text-[10px] text-ink-200">Rank #{o.rank} · {o.experienceYears}y experience</div>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-2 gap-2">
              <Mini label="Efficiency" value={`${o.efficiency}%`} tone="cat" />
              <Mini label="Safety" value={`${o.safetyScore}%`} tone="ok" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full leaderboard */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 pt-5 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Operator Leaderboard</h3>
            <p className="text-xs text-ink-200">{operators.length} active operators</p>
          </div>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-white/[0.04] text-[10px] uppercase tracking-wider text-ink-200">
                <th className="px-6 py-2.5 font-medium">Rank</th>
                <th className="px-3 py-2.5 font-medium">Operator</th>
                <th className="px-3 py-2.5 font-medium">Efficiency</th>
                <th className="px-3 py-2.5 font-medium">Safety</th>
                <th className="px-3 py-2.5 font-medium">Equipment</th>
                <th className="px-3 py-2.5 font-medium">Experience</th>
                <th className="px-3 py-2.5 font-medium">Late Returns</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((o, i) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${o.rank <= 3 ? 'bg-cat-yellow/15 text-cat-yellow' : 'bg-ink-500/40 text-ink-100'}`}>
                      {o.rank}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-500/60 text-xs font-bold text-ink-50">{o.avatar}</div>
                      <span className="text-sm font-medium text-ink-50">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-cat-yellow" />
                      <span className="text-sm text-ink-50">{o.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-ok" />
                      <span className="text-sm text-ink-50">{o.safetyScore}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-ink-100">{o.assignedEquipment}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-ink-100">
                      <Clock className="h-3.5 w-3.5 text-ink-200" />
                      {o.experienceYears}y
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {o.lateReturns === 0 ? (
                      <Badge tone="ok">0</Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-warn" />
                        <span className="text-sm text-warn">{o.lateReturns}</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: 'cat' | 'ok' }) {
  const color = tone === 'cat' ? 'text-cat-yellow' : 'text-ok';
  return (
    <div className="rounded-lg bg-ink-500/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-200">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
