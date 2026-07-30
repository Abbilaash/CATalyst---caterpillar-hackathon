import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FileText, DollarSign, AlertTriangle, Clock, Activity, Download, FileSpreadsheet, FileBarChart, Loader2
} from 'lucide-react';
import { fetchTrends } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/Page';

const tooltipStyle = {
  backgroundColor: '#1B1D20', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.75rem', fontSize: '0.75rem', color: '#C7CCD4',
};

export function ReportsPage() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTrends();
        setTrends(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageContainer title="Reports">
      <PageHeader title="Reports" subtitle="Generate and export operational reports across your fleet." />
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-cat-yellow" /></div>
      ) : (
      <>
      {/* Report cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard icon={<DollarSign className="h-5 w-5" />} title="Revenue Report" desc="Rental revenue by site, category, and period" tone="cat" delay={0} />
        <ReportCard icon={<AlertTriangle className="h-5 w-5" />} title="Downtime Report" desc="Scheduled vs unplanned downtime analysis" tone="crit" delay={0.06} />
        <ReportCard icon={<Clock className="h-5 w-5" />} title="Idle Analysis" desc="Idle hours and revenue impact by equipment" tone="warn" delay={0.12} />
        <ReportCard icon={<Activity className="h-5 w-5" />} title="Utilization Report" desc="Fleet utilization trends and benchmarks" tone="info" delay={0.18} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue (Monthly, $K)" subtitle="Actual vs target" delay={0}>
          <BarChart data={trends?.revenueTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="target" fill="#3A3F47" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" fill="#FFCD11" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Downtime (Hours)" subtitle="Scheduled vs unplanned by week" delay={0.06}>
          <BarChart data={trends?.downtimeData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="scheduled" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="unplanned" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Idle Analysis" subtitle="Idle hours by equipment category" delay={0.12}>
          <BarChart data={trends?.idleAnalysis || []} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="category" type="category" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="hours" fill="#F59E0B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Utilization" subtitle="Weekly utilization %" delay={0.18}>
          <BarChart data={trends?.utilizationTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A93A1', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="utilization" fill="#22C55E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* Export bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mt-6 flex flex-col items-center justify-between gap-4 p-5 sm:flex-row"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Export Operations Report</div>
            <div className="text-xs text-ink-200">Generate a consolidated report of all metrics above</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm">
            <FileBarChart className="h-4 w-4" />
            PDF
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </motion.div>
      </>
      )}
    </PageContainer>
  );
}

function ReportCard({
  icon, title, desc, tone, delay,
}: {
  icon: React.ReactNode; title: string; desc: string; tone: 'cat' | 'crit' | 'warn' | 'info'; delay: number;
}) {
  const color = tone === 'cat' ? 'text-cat-yellow bg-cat-yellow/10' : tone === 'crit' ? 'text-crit bg-crit/10' : tone === 'warn' ? 'text-warn bg-warn/10' : 'text-info bg-info/10';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -3 }}
      className="card card-hover p-5"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-200">{desc}</p>
      <div className="mt-3 flex items-center justify-between">
        <Badge tone="neutral">Q2 2026</Badge>
        <button className="inline-flex items-center gap-1 text-xs font-medium text-cat-yellow hover:underline">
          <Download className="h-3 w-3" /> Export
        </button>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title, subtitle, children, delay,
}: {
  title: string; subtitle: string; children: React.ReactNode; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5"
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-ink-200">{subtitle}</p>
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
