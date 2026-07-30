import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { fetchTrends } from '@/services/api';
import { useEffect, useState } from 'react';

const tooltipStyle = {
  backgroundColor: '#1B1D20',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
  color: '#C7CCD4',
};

export function DemandForecastChart() {
  const [demandForecast, setDemandForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const trends = await fetchTrends();
        setDemandForecast(trends.demandForecast || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Demand Forecast</h3>
            <p className="text-xs text-ink-200">7-day equipment demand by category</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[
            { label: 'Excavators', color: '#FFCD11' },
            { label: 'Dozers', color: '#22C55E' },
            { label: 'Loaders', color: '#3B82F6' },
            { label: 'Graders', color: '#F59E0B' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <span className="text-ink-200">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-[260px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cat-yellow" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={demandForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {[
                { key: 'Excavators', color: '#FFCD11' },
                { key: 'Dozers', color: '#22C55E' },
                { key: 'Loaders', color: '#3B82F6' },
                { key: 'Graders', color: '#F59E0B' },
              ].map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(255,205,17,0.2)' }} />
            <Area type="monotone" dataKey="Excavators" stroke="#FFCD11" strokeWidth={2} fill="url(#grad-Excavators)" />
            <Area type="monotone" dataKey="Dozers" stroke="#22C55E" strokeWidth={2} fill="url(#grad-Dozers)" />
            <Area type="monotone" dataKey="Loaders" stroke="#3B82F6" strokeWidth={2} fill="url(#grad-Loaders)" />
            <Area type="monotone" dataKey="Graders" stroke="#F59E0B" strokeWidth={2} fill="url(#grad-Graders)" />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
