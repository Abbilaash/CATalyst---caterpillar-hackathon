import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bell, BellOff, Check, CheckCheck, Eye,
  Filter, Loader2, ShieldAlert, Clock, Zap, Truck, Wrench, TrendingUp,
} from 'lucide-react';
import { fetchAlerts, markAlertRead, dismissAlert, markAllAlertsRead } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { PageContainer, PageHeader } from '@/components/ui/Page';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  targetRole: string;
  assetId?: string;
  siteId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

const severityFilters = ['All', 'critical', 'high', 'medium', 'low'];
const typeFilters = ['All', 'idle_asset', 'rental_expiring', 'rental_overdue', 'unassigned_asset', 'critical_engine', 'demand_spike', 'maintenance_due'];

const typeLabels: Record<string, string> = {
  idle_asset: 'Idle Asset',
  rental_expiring: 'Rental Expiring',
  rental_overdue: 'Rental Overdue',
  unassigned_asset: 'Unassigned',
  critical_engine: 'Engine Alert',
  demand_spike: 'Demand Spike',
  maintenance_due: 'Maintenance',
};

const severityConfig: Record<string, { bg: string; text: string; icon: typeof AlertTriangle; border: string }> = {
  critical: { bg: 'bg-crit/10', text: 'text-crit', icon: ShieldAlert, border: 'border-l-crit' },
  high: { bg: 'bg-warn/10', text: 'text-warn', icon: AlertTriangle, border: 'border-l-warn' },
  medium: { bg: 'bg-cat-yellow/10', text: 'text-cat-yellow', icon: Clock, border: 'border-l-cat-yellow' },
  low: { bg: 'bg-info/10', text: 'text-info', icon: Bell, border: 'border-l-info' },
};

const typeIcons: Record<string, typeof Truck> = {
  idle_asset: Truck,
  rental_expiring: Clock,
  rental_overdue: AlertTriangle,
  unassigned_asset: Truck,
  critical_engine: Zap,
  demand_spike: TrendingUp,
  maintenance_due: Wrench,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sevFilter, setSevFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [summary, setSummary] = useState({ total: 0, unread: 0, critical: 0, high: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAlerts('dealer');
        setAlerts(data.alerts || []);
        setSummary(data.summary || { total: 0, unread: 0, critical: 0, high: 0 });
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (sevFilter === 'All' || a.severity === sevFilter) &&
          (typeFilter === 'All' || a.type === typeFilter)
      ),
    [alerts, sevFilter, typeFilter]
  );

  const handleRead = async (id: string) => {
    try {
      await markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      setSummary((s) => ({ ...s, unread: Math.max(0, s.unread - 1) }));
    } catch {}
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismissAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setSummary((s) => ({ ...s, total: s.total - 1 }));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead('dealer');
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setSummary((s) => ({ ...s, unread: 0 }));
    } catch {}
  };

  return (
    <PageContainer title="Alert Center">
      <PageHeader
        title="Alert Center"
        subtitle="Real-time alerts engineered to protect revenue and maximize fleet utilization."
      />

      {/* KPI Band */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Bell className="h-5 w-5" />}
          label="Total Alerts"
          value={summary.total}
          color="text-cat-yellow"
          delay={0}
        />
        <KpiCard
          icon={<Eye className="h-5 w-5" />}
          label="Unread"
          value={summary.unread}
          color="text-crit"
          delay={0.06}
        />
        <KpiCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Critical"
          value={summary.critical}
          color="text-crit"
          delay={0.12}
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="High Priority"
          value={summary.high}
          color="text-warn"
          delay={0.18}
        />
      </div>

      {/* Filters + Mark all read */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-ink-200" />
          <span className="text-xs font-medium text-ink-200 mr-1">Severity</span>
          {severityFilters.map((s) => (
            <button
              key={s}
              onClick={() => setSevFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                sevFilter === s
                  ? 'bg-cat-yellow text-ink-900'
                  : 'bg-ink-500/40 text-ink-100 hover:bg-ink-500/60'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="hidden h-5 w-px bg-white/10 lg:block" />
          <span className="text-xs font-medium text-ink-200 mr-1">Type</span>
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-cat-yellow text-ink-900'
                  : 'bg-ink-500/40 text-ink-100 hover:bg-ink-500/60'
              }`}
            >
              {t === 'All' ? 'All' : typeLabels[t] || t}
            </button>
          ))}
        </div>
        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 rounded-lg bg-ink-500/40 px-4 py-2 text-xs font-medium text-ink-100 transition-colors hover:bg-ink-500/60"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
        </button>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cat-yellow" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-500/50 text-ok">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-ink-50">All clear!</h3>
          <p className="mt-1 text-sm text-ink-200">No alerts match these filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert, i) => {
            const config = severityConfig[alert.severity] || severityConfig.medium;
            const TypeIcon = typeIcons[alert.type] || Bell;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card overflow-hidden border-l-[3px] ${config.border} ${
                  !alert.isRead ? 'ring-1 ring-white/[0.06]' : 'opacity-70'
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                    <TypeIcon className={`h-5 w-5 ${config.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{alert.title}</span>
                      <Badge
                        tone={
                          alert.severity === 'critical'
                            ? 'crit'
                            : alert.severity === 'high'
                            ? 'warn'
                            : alert.severity === 'medium'
                            ? 'cat'
                            : 'info'
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="rounded-full bg-ink-500/40 px-2 py-0.5 text-[10px] text-ink-200">
                        {typeLabels[alert.type] || alert.type}
                      </span>
                      {!alert.isRead && (
                        <span className="h-2 w-2 rounded-full bg-crit animate-pulse" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-100">{alert.message}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-ink-200">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.createdAt ? timeAgo(alert.createdAt) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {alert.actionUrl && (
                      <button
                        onClick={() => {
                          handleRead(alert.id);
                          navigate(alert.actionUrl!);
                        }}
                        className="rounded-lg bg-cat-yellow/10 px-3 py-1.5 text-xs font-medium text-cat-yellow transition-colors hover:bg-cat-yellow/20"
                      >
                        View →
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="rounded-lg p-1.5 text-ink-200 transition-colors hover:bg-ink-500/40 hover:text-ink-50"
                      title="Dismiss"
                    >
                      <BellOff className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

function KpiCard({
  icon, label, value, color, delay,
}: {
  icon: React.ReactNode; label: string; value: number; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className="card card-hover p-5"
    >
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-ink-200">{label}</span>
      </div>
      <div className={`mt-3 text-3xl font-bold ${color}`}>
        <AnimatedCounter value={value} />
      </div>
    </motion.div>
  );
}
