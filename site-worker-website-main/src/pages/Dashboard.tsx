import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Construction,
  Activity as ActivityIcon,
  Users,
  AlertTriangle,
  Gauge,
  TrendingUp,
  Sun,
  Wind,
  Thermometer,
  ArrowRight,
  UserPlus,
  ClipboardList,
  Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchDashboardData, fetchAssets, fetchOperations, fetchSchedulingData } from '@/lib/api';
import { StatCard } from '@/components/common/StatCard';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ActivityTimeline } from '@/components/common/ActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [siteName, setSiteName] = useState('No assigned site');

  useEffect(() => {
    async function load() {
      try {
        const dashData = await fetchDashboardData('mgr-01');
        const assetsData = await fetchAssets('mgr-01');
        const opsData = await fetchOperations('mgr-01');
        const schedData = await fetchSchedulingData('mgr-01');
        
        const mappedMachines = assetsData.map((a: any) => ({
          id: a.id,
          machineId: a.machineId,
          name: a.name,
          category: a.assetType,
          image: `https://picsum.photos/seed/cat-${a.id}/600/400`,
          rentalStatus: a.rentalStatus === 'active' ? 'Active' : 'Available',
          status: a.status === 'working' ? 'Working' : a.status === 'maintenance' ? 'Maintenance' : 'Idle',
          healthScore: a.healthScore,
          engineHours: a.engineHours,
          idleHours: a.idleHours,
          fuelLevel: 75,
          issues: a.status === 'maintenance' ? [{ id: '1', title: 'Scheduled maintenance', severity: 'Medium' }] : [],
          upcomingMaintenance: a.status === 'maintenance' ? [] : [{ id: 'um1', type: 'Preventive Service', date: '2026-08-15', hours: a.engineHours + 250 }],
          maintenanceHistory: [],
          currentTask: opsData.find((o: any) => o.machineId === a.machineId && o.status === 'in_progress')?.task || null
        }));

        const mappedActivities = (dashData.activities || []).map((act: any) => ({
          id: act.id,
          type: act.type === 'assigned' ? 'equipment_assigned' : 'task_started',
          title: act.title,
          description: act.detail,
          timestamp: act.timestamp,
          actor: 'System'
        }));

        const mappedTasks = opsData.map((op: any) => ({
          id: op.id,
          title: op.task,
          machineId: op.machineId,
          operatorId: op.operatorId,
          priority: op.priority === 'high' ? 'High' : op.priority === 'low' ? 'Low' : 'Medium',
          status: op.status === 'in_progress' ? 'In Progress' : op.status === 'completed' ? 'Completed' : 'Pending',
          progress: op.progress,
          expectedCompletion: op.expectedCompletion,
          description: op.task
        }));

        // Map operators from scheduling data
        const mappedOps = (schedData.all_operators || []).map((o: any) => ({
          id: o.operator_id,
          name: o.name,
          avatar: `https://i.pravatar.cc/150?u=${o.operator_id}`
        }));

        setStats(dashData.stats);
        setSiteName(dashData.site_name || 'No assigned site');
        setActivitiesList(mappedActivities);
        setMachinesList(mappedMachines);
        setOperatorsList(mappedOps);
        setTodaysTasks(mappedTasks.filter((t: any) => t.status === 'In Progress' || t.status === 'Pending'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalAssets = stats?.totalAssets || 0;
  const activeRentals = stats?.activeRentals || 0;
  const machinesWorking = stats?.machinesWorking || 0;
  const idleMachines = stats?.machinesIdle || 0;
  const operatorsWorking = stats?.operatorsOnDuty || 0;
  const openIssues = stats?.safetyAlerts || 0;
  const currentSite = {
    name: siteName,
    location: 'Site location is managed by the backend',
    weather: { condition: 'Operations live', temp: '--', high: '--', low: '--', wind: '--' },
  };

  const quickActions = [
    { label: 'Schedule Task', icon: UserPlus, to: '/scheduling', tone: 'text-info' },
    { label: 'Assign Equipment', icon: Construction, to: '/assets', tone: 'text-primary' },
    { label: 'Create Task', icon: Plus, to: '/operations', tone: 'text-success' },
  ];

  const getOperator = (opId: string | null) => {
    return operatorsList.find(o => o.id === opId);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-accent/40 p-6 lg:p-8"
      >
        {/* decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Shift Status · Active · Day Shift
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Welcome back, Site Manager
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {currentSite.name}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentSite.location} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <Sun className="h-4 w-4 text-warning" />
                {currentSite.weather.condition}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <Thermometer className="h-4 w-4 text-destructive" />
                {currentSite.weather.temp}°F
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
                <Wind className="h-4 w-4 text-info" />
                {currentSite.weather.wind} mph wind
              </span>
            </div>
          </div>

          {/* Weather widget */}
          <div className="shrink-0 rounded-xl border border-border bg-card/60 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/15">
                <Sun className="h-7 w-7 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {currentSite.weather.temp}°
                </p>
                <p className="text-xs text-muted-foreground">
                  H {currentSite.weather.high}° · L {currentSite.weather.low}°
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" /> {currentSite.weather.wind} mph
              </div>
              <div className="flex items-center gap-1">
                <Sun className="h-3 w-3" /> Clear skies
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard index={0} label="Total Assets" value={totalAssets} icon={Construction} tone="primary" delta={0} deltaLabel="vs last week" />
        <StatCard index={1} label="Active Rentals" value={activeRentals} icon={ActivityIcon} tone="success" delta={2} deltaLabel="vs last week" />
        <StatCard index={2} label="Machines Working" value={machinesWorking} icon={Gauge} tone="info" delta={5} deltaLabel="vs last week" />
        <StatCard index={3} label="Idle Machines" value={idleMachines} icon={TrendingUp} tone="warning" delta={-1} deltaLabel="vs last week" />
        <StatCard index={4} label="Operators Working" value={operatorsWorking} icon={Users} tone="primary" delta={1} deltaLabel="on shift now" />
        <StatCard index={5} label="Open Issues" value={openIssues} icon={AlertTriangle} tone="danger" delta={1} deltaLabel="needs attention" />
        <StatCard index={6} label="Tasks In Progress" value={todaysTasks.length} icon={ClipboardList} tone="info" delta={3} deltaLabel="active today" />
      </div>

      {/* Today's operations + activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's operations */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Today's Operations</h2>
              <p className="text-sm text-muted-foreground">Live site activities in progress</p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-border bg-transparent">
              <Link to="/operations">
                View all <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {todaysTasks.slice(0, 6).map((task, i) => {
              const machine = machinesList.find((m) => m.machineId === task.machineId);
              const operator = getOperator(task.operatorId);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Card className="h-full border-border transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:shadow-black/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {machine?.name ?? 'Unassigned'}
                          </p>
                        </div>
                        <StatusChip status={task.priority} variant="priority" showIcon={false} />
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        {operator ? (
                          <>
                            <img
                              src={operator.avatar}
                              alt={operator.name}
                              className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
                            />
                            <span className="truncate">{operator.name}</span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 italic text-muted-foreground/70">
                            <Users className="h-3.5 w-3.5" /> Operator needed
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium tabular-nums text-foreground">
                            {task.progress}%
                          </span>
                        </div>
                        <ProgressBar value={task.progress} size="sm" />
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <StatusChip status={task.status} showIcon={false} />
                        <span className="text-[11px] text-muted-foreground">
                          ETA {new Date(task.expectedCompletion).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Latest site events</p>
            </div>
          </div>
          <Card className="border-border">
            <CardContent className="p-4">
              <ActivityTimeline activities={activitiesList} limit={7} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Common site management tasks</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to={action.to}
                  className={cn(
                    'group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-all duration-300 hover:border-primary/40 hover:bg-accent/40'
                  )}
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-primary/15', action.tone)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </Link>
              </motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
