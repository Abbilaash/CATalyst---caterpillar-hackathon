import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Wrench, Play, UserCheck, Clock, AlertTriangle, Activity, Loader2, Sparkles } from 'lucide-react';
import { fetchActivity } from '@/services/api';

const iconMap: Record<string, { icon: any; tone: string }> = {
  ai: { icon: Brain, tone: 'text-cat-yellow bg-cat-yellow/10' },
  maintenance: { icon: Wrench, tone: 'text-info bg-info/10' },
  start: { icon: Play, tone: 'text-ok bg-ok/10' },
  assign: { icon: UserCheck, tone: 'text-ink-100 bg-ink-100/10' },
  extend: { icon: Clock, tone: 'text-warn bg-warn/10' },
  alert: { icon: AlertTriangle, tone: 'text-crit bg-crit/10' },
};

export function ActivityTimeline() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActivity();
        setActivities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card h-full p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
          <p className="text-xs text-ink-200">Live fleet events</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[15px] top-1 bottom-1 w-px bg-white/[0.06]" />
        
        {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-cat-yellow" /></div>
        ) : (
            <div className="space-y-4">
            {activities.map((e, i) => {
                const cfg = iconMap[e.type] || { icon: Activity, tone: 'text-ink-100 bg-ink-100/10' };
                return (
                <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="relative flex gap-3"
                >
                    <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.tone}`}
                    >
                    <cfg.icon className="h-4 w-4" />
                    </div>
                    <div className="pt-0.5">
                    <div className="text-sm font-medium text-ink-50">{e.title}</div>
                    <div className="text-xs text-ink-200">{e.detail}</div>
                    <div className="mt-0.5 text-[10px] text-ink-200">{e.time}</div>
                    </div>
                </motion.div>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
}
