import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Layers, Maximize2, Filter, Loader2 } from 'lucide-react';
import { fetchMapMarkers } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/Page';

const statusConfig = {
  working: { color: '#22C55E', label: 'Working' },
  idle: { color: '#F59E0B', label: 'Idle' },
  critical: { color: '#EF4444', label: 'Critical' },
  maintenance: { color: '#3B82F6', label: 'Maintenance' },
};

export function LiveOperationsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMapMarkers();
        setMapMarkers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markers = filter === 'all' ? mapMarkers : mapMarkers.filter((m) => m.status === filter);
  const counts = {
    working: mapMarkers.filter((m) => m.status === 'working').length,
    idle: mapMarkers.filter((m) => m.status === 'idle').length,
    critical: mapMarkers.filter((m) => m.status === 'critical').length,
    maintenance: mapMarkers.filter((m) => m.status === 'maintenance').length,
  };

  return (
    <PageContainer title="Live Operations">
      <PageHeader
        title="Live Operations"
        subtitle="Real-time fleet positioning across all active sites."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="ok" dot>Live</Badge>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-100 hover:bg-white/5">
              <Layers className="h-3.5 w-3.5" /> Layers
            </button>
          </div>
        }
      />
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-cat-yellow" /></div>
      ) : (
      <>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <Filter className="h-4 w-4 shrink-0 text-ink-200" />
        {[
          { key: 'all', label: 'All', count: mapMarkers.length, color: '#FFCD11' },
          { key: 'working', label: 'Working', count: counts.working, color: '#22C55E' },
          { key: 'idle', label: 'Idle', count: counts.idle, color: '#F59E0B' },
          { key: 'critical', label: 'Critical', count: counts.critical, color: '#EF4444' },
          { key: 'maintenance', label: 'Maintenance', count: counts.maintenance, color: '#3B82F6' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-ink-500/70 text-white' : 'bg-ink-600/40 text-ink-200 hover:text-ink-100'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
            {f.label}
            <span className="text-ink-200">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <div className="card relative overflow-hidden">
            <div className="relative h-[520px] w-full grid-bg bg-ink-900">
              {/* Faux topography contours */}
              <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="terrain" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#1B1D20" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#0E0F11" stopOpacity={0} />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#terrain)" />
                {[...Array(6)].map((_, i) => (
                  <ellipse
                    key={i}
                    cx={`${30 + i * 8}%`}
                    cy={`${40 + (i % 3) * 12}%`}
                    rx={`${20 + i * 4}%`}
                    ry={`${12 + i * 2}%`}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                  />
                ))}
              </svg>

              {/* Site zone labels */}
              {[
                { name: 'SITE ALPHA', x: 40, y: 42 },
                { name: 'SITE BRAVO', x: 30, y: 70 },
                { name: 'SITE CHARLIE', x: 47, y: 63 },
                { name: 'SITE DELTA', x: 78, y: 46 },
              ].map((s) => (
                <div
                  key={s.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-widest text-ink-200/60"
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                >
                  {s.name}
                </div>
              ))}

              {/* Markers */}
              {markers.map((m, i) => {
                const cfg = statusConfig[m.status as keyof typeof statusConfig];
                const isSel = selected === m.id;
                return (
                  <motion.button
                    key={m.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
                    onClick={() => setSelected(isSel ? null : m.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <span className="relative flex h-4 w-4">
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
                        style={{ background: cfg.color }}
                      />
                      <span
                        className="relative inline-flex h-4 w-4 rounded-full ring-2 ring-ink-900"
                        style={{ background: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }}
                      />
                    </span>
                    <AnimatePresence>
                      {isSel && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.9 }}
                          className="absolute left-1/2 top-6 z-20 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-ink-700/95 p-3 text-left shadow-card-hover backdrop-blur-xl"
                        >
                          <div className="text-xs font-semibold text-white">{m.label}</div>
                          <div className="mt-0.5 text-[10px] text-ink-200">{m.site}</div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
                            <span className="text-[10px] text-ink-100">{cfg.label}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}

              <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-700/80 px-3 py-1.5 backdrop-blur">
                <Radio className="h-3.5 w-3.5 text-ok animate-pulse-soft" />
                <span className="text-[10px] text-ink-200">Tracking {markers.length} assets</span>
              </div>
              <button className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-700/80 text-ink-200 backdrop-blur hover:text-white">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend / status panel */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white">Fleet Status</h3>
            <p className="text-xs text-ink-200">Distribution across {mapMarkers.length} tracked assets</p>
            <div className="mt-4 space-y-3">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-sm text-ink-100">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {counts[key as keyof typeof counts]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-400">
              <div className="flex h-full">
                <div style={{ width: `${(counts.working / mapMarkers.length) * 100}%`, background: '#22C55E' }} />
                <div style={{ width: `${(counts.idle / mapMarkers.length) * 100}%`, background: '#F59E0B' }} />
                <div style={{ width: `${(counts.critical / mapMarkers.length) * 100}%`, background: '#EF4444' }} />
                <div style={{ width: `${(counts.maintenance / mapMarkers.length) * 100}%`, background: '#3B82F6' }} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
            <div className="mt-3 space-y-2.5">
              <div className="rounded-lg border border-crit/20 bg-crit/[0.06] p-3">
                <div className="text-xs font-semibold text-crit">CAT 336 Excavator</div>
                <div className="text-[10px] text-ink-200">Engine temperature elevated — Site Charlie</div>
              </div>
              <div className="rounded-lg border border-warn/20 bg-warn/[0.06] p-3">
                <div className="text-xs font-semibold text-warn">CAT 320 Excavator</div>
                <div className="text-[10px] text-ink-200">Idle 14h — relocation recommended</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}
    </PageContainer>
  );
}
