import { motion } from 'framer-motion';
import {
  BarChart3,
  Gauge,
  Timer,
  Users,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  fleetUtilizationData,
  downtimeData,
  operatorProductivityData,
  completedTasksData,
  maintenanceCostData,
  rentalPerformanceData,
  machines,
  operators,
} from '@/data/mock-data';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  fontSize: '12px',
  color: 'hsl(var(--foreground))',
};

export function Reports() {
  const fleetUtilization = Math.round(
    (machines.filter((m) => m.status === 'Working').length / machines.length) * 100
  );
  const avgDowntime = Math.round(
    downtimeData.reduce((a, d) => a + d.hours, 0) / downtimeData.length
  );
  const avgProductivity = Math.round(
    operators.reduce((a, o) => a + o.performance, 0) / operators.length
  );
  const completedTasks = completedTasksData.reduce((a, d) => a + d.tasks, 0);
  const totalMaintenanceCost = maintenanceCostData.reduce((a, d) => a + d.cost, 0);
  const totalRentalRevenue = rentalPerformanceData.reduce((a, d) => a + d.revenue, 0);

  const categoryDistribution = machines.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }));
  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))', 'hsl(var(--info))'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Fleet performance and operational insights"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <Button variant="outline" className="border-border bg-transparent">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard index={0} label="Fleet Utilization" value={`${fleetUtilization}%`} icon={Gauge} tone="primary" delta={3} />
        <StatCard index={1} label="Avg Downtime" value={`${avgDowntime}h`} icon={Timer} tone="warning" delta={-2} />
        <StatCard index={2} label="Avg Productivity" value={`${avgProductivity}%`} icon={Users} tone="success" delta={4} />
        <StatCard index={3} label="Completed Tasks" value={completedTasks} icon={CheckCircle2} tone="info" delta={8} />
        <StatCard index={4} label="Maintenance Cost" value={`$${(totalMaintenanceCost / 1000).toFixed(1)}k`} icon={DollarSign} tone="danger" delta={12} />
        <StatCard index={5} label="Rental Revenue" value={`$${(totalRentalRevenue / 1000).toFixed(1)}k`} icon={TrendingUp} tone="success" delta={6} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fleet utilization */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fleet Utilization</CardTitle>
            <CardDescription className="text-xs">Working vs idle vs maintenance — this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fleetUtilizationData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gWorking" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gIdle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Area type="monotone" dataKey="working" stroke="hsl(var(--chart-1))" fill="url(#gWorking)" strokeWidth={2} />
                <Area type="monotone" dataKey="idle" stroke="hsl(var(--chart-4))" fill="url(#gIdle)" strokeWidth={2} />
                <Area type="monotone" dataKey="maintenance" stroke="hsl(var(--chart-2))" fill="url(#gMaint)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Equipment downtime */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Equipment Downtime</CardTitle>
            <CardDescription className="text-xs">Hours of downtime by machine — this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={downtimeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {downtimeData.map((d, i) => (
                    <Cell key={i} fill={d.hours >= 24 ? 'hsl(var(--destructive))' : d.hours >= 12 ? 'hsl(var(--warning))' : 'hsl(var(--chart-2))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Operator productivity */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Operator Productivity & Safety</CardTitle>
            <CardDescription className="text-xs">Performance scores by operator</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={operatorProductivityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="performance" name="Productivity" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="safety" name="Safety" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completed tasks trend */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Completed Tasks</CardTitle>
            <CardDescription className="text-xs">Weekly task completion — last 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={completedTasksData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="tasks" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--chart-3))', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fleet composition */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fleet Composition</CardTitle>
            <CardDescription className="text-xs">Equipment by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance cost */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maintenance Cost</CardTitle>
            <CardDescription className="text-xs">Monthly spend — last 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={maintenanceCostData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                <Bar dataKey="cost" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rental performance */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rental Performance</CardTitle>
            <CardDescription className="text-xs">Revenue by site — this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rentalPerformanceData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
