import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, Activity, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchEquipment } from '@/services/api';
import { Equipment } from '@/types';

import { Badge, statusTone } from '@/components/ui/Badge';
import { RingGauge } from '@/components/ui/RingGauge';

const statusLabel: Record<string, string> = {
  working: 'Working',
  idle: 'Idle',
  critical: 'Critical',
  maintenance: 'Maintenance',
  transit: 'Transit',
};

export function FleetStatusTable() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEquipment();
        setEquipment(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Fleet Status</h3>
            <p className="text-xs text-ink-200">{equipment.length} machines across 4 sites</p>
          </div>
        </div>
      </div>
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-y border-white/[0.04] text-[10px] uppercase tracking-wider text-ink-200">
              <th className="px-6 py-2.5 font-medium">Equipment</th>
              <th className="px-3 py-2.5 font-medium">Current Site</th>
              <th className="px-3 py-2.5 font-medium">Operator</th>
              <th className="px-3 py-2.5 font-medium">Health</th>
              <th className="px-3 py-2.5 font-medium">Idle Hrs</th>
              <th className="px-3 py-2.5 font-medium">Rental Left</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium text-right">Quick View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center"><Loader2 className="inline h-6 w-6 animate-spin text-cat-yellow" /></td>
              </tr>
            ) : equipment.map((eq, i) => (
              <motion.tr
                key={eq.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={eq.image}
                      alt={eq.name}
                      className="h-9 w-12 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div>
                      <div className="text-sm font-medium text-ink-50">{eq.name}</div>
                      <div className="text-[10px] text-ink-200">{eq.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-ink-100">{eq.site}</td>
                <td className="px-3 py-3 text-sm text-ink-100">{eq.operator}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <RingGauge
                      value={eq.health}
                      size={36}
                      stroke={4}
                      tone={eq.health > 85 ? 'ok' : eq.health > 70 ? 'warn' : 'crit'}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 text-sm">
                  <span className={eq.idleHours > 6 ? 'text-warn' : 'text-ink-100'}>
                    {eq.idleHours}h
                  </span>
                </td>
                <td className="px-3 py-3 text-sm">
                  <span className={eq.rentalRemainingDays <= 6 ? 'text-crit' : 'text-ink-100'}>
                    {eq.rentalRemainingDays}d
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={statusTone(eq.status)} dot={eq.status === 'critical'}>
                    {statusLabel[eq.status]}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => navigate(`/equipment/${eq.id}`)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cat-yellow transition-colors hover:bg-cat-yellow/10"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
