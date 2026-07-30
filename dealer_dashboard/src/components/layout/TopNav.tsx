import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Menu, Search, ChevronDown, X, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchAlerts, markAlertRead } from '@/services/api';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

const severityColor: Record<string, string> = {
  critical: 'border-l-crit bg-crit/5',
  high: 'border-l-warn bg-warn/5',
  medium: 'border-l-cat-yellow bg-cat-yellow/5',
  low: 'border-l-info bg-info/5',
};

const severityDot: Record<string, string> = {
  critical: 'bg-crit',
  high: 'bg-warn',
  medium: 'bg-cat-yellow',
  low: 'bg-info',
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

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch alerts and poll every 30s
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAlerts('dealer');
        setAlerts(data.alerts || []);
        setUnreadCount(data.summary?.unread || 0);
      } catch (e) {
        // Silently fail on polling
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAlertClick = async (alert: Alert) => {
    if (!alert.isRead) {
      try { await markAlertRead(alert.id); } catch {}
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
    setDropdownOpen(false);
  };

  const topAlerts = alerts.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.04] bg-ink-800/80 px-4 backdrop-blur-xl lg:px-8">
      <IconButton className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </IconButton>

      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-200" />
        <input
          type="text"
          placeholder="Search equipment, sites, operators..."
          className="w-full rounded-lg border border-white/[0.06] bg-ink-600/60 py-2 pl-10 pr-4 text-sm text-ink-50 placeholder:text-ink-200 focus:border-cat-yellow/40 focus:outline-none focus:ring-1 focus:ring-cat-yellow/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge tone="ok" dot className="hidden md:inline-flex">
          All Systems Operational
        </Badge>

        {/* Bell with alert dropdown */}
        <div className="relative" ref={dropdownRef}>
          <IconButton
            className="relative"
            aria-label="Notifications"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-crit px-1 text-[10px] font-bold text-white ring-2 ring-ink-800"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </IconButton>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/[0.08] bg-ink-700/95 shadow-card-hover backdrop-blur-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-cat-yellow" />
                    <span className="text-sm font-semibold text-white">Alerts</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-crit/20 px-2 py-0.5 text-[10px] font-bold text-crit">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/alerts'); }}
                    className="text-xs text-cat-yellow hover:underline"
                  >
                    View All
                  </button>
                </div>

                {/* Alert list */}
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {topAlerts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-ink-200">
                      No alerts right now 🎉
                    </div>
                  ) : (
                    topAlerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => handleAlertClick(alert)}
                        className={`w-full border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                          severityColor[alert.severity] || 'border-l-ink-300'
                        } ${!alert.isRead ? '' : 'opacity-60'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[alert.severity] || 'bg-ink-300'} ${
                            !alert.isRead ? 'animate-pulse' : ''
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                              <span className="ml-2 shrink-0 text-[10px] text-ink-200">
                                {alert.createdAt ? timeAgo(alert.createdAt) : ''}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-ink-100 line-clamp-2">{alert.message}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.06] p-2">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/alerts'); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-cat-yellow transition-colors hover:bg-cat-yellow/10"
                  >
                    Open Alert Center <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cat-yellow to-cat-yellow-dark text-xs font-bold text-ink-900">
            JD
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-ink-50">Jordan Diaz</div>
            <div className="text-[10px] text-ink-200">Regional Dealer</div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-ink-200 sm:block" />
        </button>
      </div>
    </header>
  );
}
