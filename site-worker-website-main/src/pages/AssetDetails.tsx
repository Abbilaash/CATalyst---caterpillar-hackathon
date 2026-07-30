import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Construction,
  Fuel,
  Gauge,
  Wrench,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { fetchAssets, fetchSchedulingData, fetchMaintenanceLogs } from '@/lib/api';

export function AssetDetails() {
  const { id } = useParams();
  const [machine, setMachine] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [site, setSite] = useState<any>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const assetsData = await fetchAssets('mgr-01');
        const schedData = await fetchSchedulingData('mgr-01');
        
        const matchingAsset = assetsData.find((a: any) => a.id === id);
        if (!matchingAsset) {
          setLoading(false);
          return;
        }

        const mappedMachine = {
          id: matchingAsset.id,
          machineId: matchingAsset.machineId,
          name: matchingAsset.name,
          category: matchingAsset.assetType,
          image: `https://picsum.photos/seed/cat-${matchingAsset.id}/600/400`,
          rentalStatus: matchingAsset.rentalStatus === 'active' ? 'Active' : 'Available',
          status: matchingAsset.status === 'working' ? 'Working' : matchingAsset.status === 'maintenance' ? 'Maintenance' : 'Idle',
          healthScore: matchingAsset.healthScore,
          engineHours: matchingAsset.engineHours,
          idleHours: matchingAsset.idleHours,
          fuelLevel: 75,
          year: 2022,
          serialNumber: matchingAsset.machineId,
          assignedOperatorId: matchingAsset.assignedOperatorId,
          currentTask: matchingAsset.status === 'working' ? 'Active assignment' : null,
          rentalStart: '2026-06-01',
          rentalEnd: '2026-09-30',
          dailyRate: 1500,
          issues: matchingAsset.status === 'maintenance' ? [{ id: '1', title: 'Scheduled maintenance', severity: 'Medium', reportedDate: '2026-07-30' }] : [],
          upcomingMaintenance: matchingAsset.status === 'maintenance' ? [] : [{ id: 'um1', type: 'Preventive Service', date: '2026-08-15', hours: matchingAsset.engineHours + 250 }]
        };

        setMachine(mappedMachine);

        // Map operator
        if (matchingAsset.assignedOperatorId) {
          const op = (schedData.all_operators || []).find((o: any) => o.operator_id === matchingAsset.assignedOperatorId);
          if (op) {
            setOperator({
              id: op.operator_id,
              name: op.name,
              avatar: `https://i.pravatar.cc/150?u=${op.operator_id}`,
              role: 'Equipment Operator',
              shift: op.status === 'on_duty' ? 'On Shift' : 'Off Shift'
            });
          }
        }

        // Map site from assignments or manager site
        const activeSite = (schedData.sites || []).find((s: any) => s.site_id === matchingAsset.siteId) || {
          id: 'site-01',
          name: 'Highland Quarry',
          location: 'Edinburgh, UK'
        };
        setSite(activeSite);

        // Fetch maintenance history
        try {
          const logs = await fetchMaintenanceLogs(id);
          const mappedLogs = logs.map((l: any) => ({
            id: l.id,
            type: l.event,
            description: l.remarks || 'Routine servicing',
            date: l.date,
            hours: mappedMachine.engineHours,
            technician: 'Field Service Team',
            status: l.status === 'done' ? 'Completed' : 'In Progress',
            cost: 850
          }));
          setMaintenanceHistory(mappedLogs);
        } catch (e) {
          console.warn("Could not fetch maintenance logs, using mock", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!machine) {
    return (
      <EmptyState
        title="Machine not found"
        description="The equipment you're looking for doesn't exist or has been removed."
        action={{ label: 'Back to Assets', to: '/assets' }}
      />
    );
  }

  const rentalDaysLeft = Math.max(
    0,
    Math.ceil((new Date(machine.rentalEnd).getTime() - Date.now()) / 86400000)
  );
  const rentalTotalDays = Math.ceil(
    (new Date(machine.rentalEnd).getTime() - new Date(machine.rentalStart).getTime()) / 86400000
  );
  const rentalProgress = Math.min(
    100,
    Math.max(0, ((rentalTotalDays - rentalDaysLeft) / rentalTotalDays) * 100)
  );

  const infoItems = [
    { label: 'Machine ID', value: machine.machineId, mono: true },
    { label: 'Serial Number', value: machine.serialNumber, mono: true },
    { label: 'Category', value: machine.category },
    { label: 'Model Year', value: String(machine.year) },
    { label: 'Current Site', value: site?.name ?? 'Unknown' },
    { label: 'Location', value: site?.location || site?.address || 'Unknown' },
    { label: 'Daily Rate', value: `$${machine.dailyRate.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={machine.name}
        description={`${machine.category} · ${machine.machineId}`}
        icon={<Construction className="h-5 w-5" />}
        backTo="/assets"
        backLabel="Back to Assets"
        actions={
          <>
            <Button variant="outline" className="border-border bg-transparent">
              <Wrench className="mr-1.5 h-4 w-4" /> Schedule Service
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Reassign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: image + key stats */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="overflow-hidden border-border p-0">
            <div className="relative aspect-[4/3] overflow-hidden bg-accent">
              <img src={machine.image} alt={machine.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex gap-2">
                <StatusChip status={machine.rentalStatus} />
                <StatusChip status={machine.status} showIcon={false} />
              </div>
            </div>
          </Card>

          {/* Key metrics */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Live Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow icon={Gauge} label="Health Score" tone={machine.healthScore >= 85 ? 'success' : machine.healthScore >= 70 ? 'warning' : 'danger'}>
                <div className="flex items-center gap-2">
                  <div className="w-20"><ProgressBar value={machine.healthScore} size="sm" tone={machine.healthScore >= 85 ? 'success' : machine.healthScore >= 70 ? 'warning' : 'danger'} /></div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{machine.healthScore}</span>
                </div>
              </MetricRow>
              <MetricRow icon={Clock} label="Engine Hours">
                <span className="text-sm font-semibold tabular-nums text-foreground">{machine.engineHours.toLocaleString()}h</span>
              </MetricRow>
              <MetricRow icon={Clock} label="Idle Hours">
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">{machine.idleHours.toLocaleString()}h</span>
              </MetricRow>
              <MetricRow icon={Fuel} label="Fuel Level" tone={machine.fuelLevel <= 30 ? 'danger' : machine.fuelLevel <= 50 ? 'warning' : 'success'}>
                <div className="flex items-center gap-2">
                  <div className="w-20"><ProgressBar value={machine.fuelLevel} size="sm" tone={machine.fuelLevel <= 30 ? 'danger' : machine.fuelLevel <= 50 ? 'warning' : 'success'} /></div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{machine.fuelLevel}%</span>
                </div>
              </MetricRow>
            </CardContent>
          </Card>
        </div>

        {/* Right: details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Machine info */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Machine Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {infoItems.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {item.icon && <item.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className={cn(item.mono && 'font-mono text-xs')}>{item.value}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Rental timeline */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rental Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">{new Date(machine.rentalStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium text-foreground">{new Date(machine.rentalEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <ProgressBar value={rentalProgress} size="md" tone="primary" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{Math.round(rentalProgress)}% elapsed</span>
                <span className={cn('font-medium', rentalDaysLeft <= 14 ? 'text-warning' : 'text-foreground')}>
                  {rentalDaysLeft} days remaining
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Current operator + task */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Operator</CardTitle>
              </CardHeader>
              <CardContent>
                {operator ? (
                  <Link to={`/operators/${operator.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50">
                    <img src={operator.avatar} alt={operator.name} className="h-12 w-12 rounded-full object-cover ring-1 ring-border" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{operator.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{operator.role}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusChip status={operator.shift} showIcon={false} />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="italic">No operator assigned</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Task</CardTitle>
              </CardHeader>
              <CardContent>
                {machine.currentTask ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">{machine.currentTask}</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{site?.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="italic">No active task</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Open issues + upcoming maintenance */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-warning" /> Open Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {machine.issues.length === 0 ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" /> No open issues
                  </div>
                ) : (
              machine.issues.map((issue: any) => (
                    <div key={issue.id} className="rounded-lg border border-border/60 bg-accent/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <StatusChip status={issue.severity === 'High' ? 'High' : issue.severity === 'Medium' ? 'Medium' : 'Low'} variant="priority" showIcon={false} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Reported {new Date(issue.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" /> Upcoming Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {machine.upcomingMaintenance.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">Nothing scheduled</p>
                ) : (
              machine.upcomingMaintenance.map((um: any) => (
                    <div key={um.id} className="rounded-lg border border-border/60 bg-accent/30 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{um.type}</p>
                        <span className="text-xs text-primary">{new Date(um.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">At {um.hours.toLocaleString()} engine hours</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Maintenance history */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4 text-info" /> Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceHistory.map((mh) => (
                  <div key={mh.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-accent/20 p-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{mh.type}</p>
                        <StatusChip status={mh.status} showIcon={false} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{mh.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{new Date(mh.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>{mh.hours.toLocaleString()} hrs</span>
                        <span>{mh.technician}</span>
                        <span className="font-medium text-foreground">${mh.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  tone,
  children,
}: {
  icon: typeof Gauge;
  label: string;
  tone?: 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const toneText = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-destructive' : '';
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn('h-4 w-4', toneText)} /> {label}
      </span>
      {children}
    </div>
  );
}


