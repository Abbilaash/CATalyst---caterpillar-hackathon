import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Plus,
  Clock,
  AlertTriangle,
  History,
  Gauge,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { fetchAssets, fetchMaintenanceLogs } from '@/lib/api';

export function Maintenance() {
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [upcomingSorted, setUpcomingSorted] = useState<any[]>([]);
  const [overdueMachines, setOverdueMachines] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approveRequest, setApproveRequest] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const assets = await fetchAssets('mgr-01');
        
        const mappedMachines = assets.map((a: any) => ({
          id: a.id,
          machineId: a.machineId,
          name: a.name,
          category: a.assetType,
          image: `https://picsum.photos/seed/cat-${a.id}/600/400`,
          status: a.status === 'working' ? 'Working' : a.status === 'maintenance' ? 'Maintenance' : 'Idle',
          healthScore: a.healthScore,
          engineHours: a.engineHours,
          idleHours: a.idleHours,
          issues: a.status === 'maintenance' ? [{ id: '1', title: 'Scheduled maintenance', severity: 'Medium' }] : [],
        }));

        setMachinesList(mappedMachines);

        // Fetch maintenance logs for all assets
        const allLogsPromises = assets.map(async (a: any) => {
          try {
            const logs = await fetchMaintenanceLogs(a.id);
            return logs.map((l: any) => ({
              ...l,
              assetId: a.id,
              machineName: a.name,
              machineIdStr: a.machineId,
              image: `https://picsum.photos/seed/cat-${a.id}/600/400`
            }));
          } catch (e) {
            return [];
          }
        });

        const allLogsResults = await Promise.all(allLogsPromises);
        const flatLogs = allLogsResults.flat();

        // Separate upcoming, requests, history
        const upcomingMapped = flatLogs
          .filter((l: any) => l.status === 'upcoming' || l.status === 'scheduled')
          .map((l: any) => ({
            id: l.id,
            type: l.event,
            date: l.date,
            hours: mappedMachines.find((m: any) => m.id === l.assetId)?.engineHours || 1000,
            machine: mappedMachines.find((m: any) => m.id === l.assetId)
          }));
        setUpcomingSorted(upcomingMapped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        const overdueMapped = mappedMachines.filter(
          (m: any) => m.healthScore < 75 || m.status === 'Maintenance'
        );
        setOverdueMachines(overdueMapped);

        const historyMapped = flatLogs
          .filter((l: any) => l.status === 'done' || l.status === 'completed' || l.status === 'Completed')
          .map((l: any) => ({
            id: l.id,
            type: l.event,
            description: l.remarks || 'Routine maintenance',
            date: l.date,
            hours: mappedMachines.find((m: any) => m.id === l.assetId)?.engineHours || 1000,
            cost: 850,
            machine: mappedMachines.find((m: any) => m.id === l.assetId)
          }));
        setHistoryList(historyMapped);

        const reqs = flatLogs
          .filter((l: any) => l.status === 'requested' || l.status === 'Requested')
          .map((l: any) => ({
            id: l.id,
            machineId: l.assetId,
            machineName: l.machineName,
            requestType: l.event,
            description: l.remarks || 'Operator reported issue',
            priority: 'Medium',
            status: 'Requested',
            requestedBy: 'Operator',
            requestedDate: l.date,
            estimatedCost: 950
          }));
        setMaintenanceRequests(reqs);
        setTotalCost(historyMapped.reduce((sum, h) => sum + h.cost, 0));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleApprove = (id: string) => {
    setApproveRequest(null);
    toast({
      title: 'Maintenance request approved',
      description: 'Service has been scheduled and the technician notified.',
    });
  };

  const getMachine = (id: string) => {
    return machinesList.find((m) => m.id === id);
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Schedule, track, and manage equipment service"
        icon={<Wrench className="h-5 w-5" />}
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New Request
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Upcoming Services" value={upcomingSorted.length} icon={CalendarClock} tone="primary" />
        <StatCard index={1} label="Overdue / At Risk" value={overdueMachines.length} icon={AlertTriangle} tone="danger" />
        <StatCard index={2} label="Open Requests" value={maintenanceRequests.filter((r) => r.status === 'Requested').length} icon={Clock} tone="warning" />
        <StatCard index={3} label="Total Cost (YTD)" value={`$${(totalCost / 1000).toFixed(1)}k`} icon={DollarSign} tone="success" />
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="border-border bg-card">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Overdue</TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Requests</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">History</TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary">Health</TabsTrigger>
        </TabsList>

        {/* Upcoming services */}
        <TabsContent value="upcoming" className="space-y-3">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" /> Upcoming Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingSorted.map((um, i) => (
                <motion.div
                  key={um.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-lg border border-border/60 bg-accent/30 p-3 transition-colors hover:bg-accent/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{um.type}</p>
                    <p className="truncate text-xs text-muted-foreground">{um.machine.name} · {um.machine.machineId}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium text-foreground">
                      {new Date(um.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">at {um.hours.toLocaleString()} hrs</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue / at-risk machines */}
        <TabsContent value="overdue" className="space-y-3">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue & At-Risk Machines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueMachines.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <img src={m.image} alt="" className="h-12 w-16 rounded-md object-cover ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.machineId} · {m.engineHours.toLocaleString()} hrs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.issues.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> {m.issues.length} issue{m.issues.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p className={cn('text-sm font-bold tabular-nums', m.healthScore < 70 ? 'text-destructive' : 'text-warning')}>{m.healthScore}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance requests */}
        <TabsContent value="requests" className="space-y-3">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-warning" /> Maintenance Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {maintenanceRequests.map((req, i) => {
                const machine = getMachine(req.machineId);
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg border border-border/60 bg-accent/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{req.requestType}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{req.machineName}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <StatusChip status={req.priority} variant="priority" showIcon={false} />
                        <StatusChip status={req.status} showIcon={false} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{req.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {req.requestedBy}</span>
                      <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {new Date(req.requestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Est. ${req.estimatedCost.toLocaleString()}</span>
                      {machine && (
                        <span className="ml-auto font-mono text-[11px]">{machine.machineId}</span>
                      )}
                    </div>
                    {req.status === 'Requested' && (
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-7 border-border bg-transparent text-xs">Decline</Button>
                        <Button
                          size="sm"
                          className="h-7 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
                          onClick={() => setApproveRequest(req.id)}
                        >
                          Approve & Schedule
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service history */}
        <TabsContent value="history" className="space-y-3">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-info" /> Service History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {historyList.map((mh, i) => (
                <motion.div
                  key={mh.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-lg border border-border/60 bg-accent/30 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{mh.type} · {mh.machine.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{mh.description}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium text-foreground">{new Date(mh.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[11px] text-muted-foreground">{mh.hours.toLocaleString()} hrs · ${mh.cost.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Machine health cards */}
        <TabsContent value="health" className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {machinesList.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border transition-all duration-300 hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={m.image} alt="" className="h-12 w-16 rounded-md object-cover ring-1 ring-border" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">{m.machineId}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Gauge className="h-3.5 w-3.5" /> Health
                        </span>
                        <span className={cn(
                          'font-semibold tabular-nums',
                          m.healthScore >= 85 ? 'text-success' : m.healthScore >= 70 ? 'text-warning' : 'text-destructive'
                        )}>{m.healthScore}</span>
                      </div>
                      <ProgressBar value={m.healthScore} size="sm" tone={m.healthScore >= 85 ? 'success' : m.healthScore >= 70 ? 'warning' : 'danger'} />
                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                        <span>{m.engineHours.toLocaleString()} hrs</span>
                        {m.issues.length > 0 ? (
                          <span className="text-warning">{m.issues.length} open issue{m.issues.length > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-success">No issues</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={approveRequest !== null}
        onOpenChange={(o) => !o && setApproveRequest(null)}
        title="Approve maintenance request?"
        description="This will schedule the service and notify the assigned technician."
        confirmLabel="Approve & Schedule"
        icon={<Wrench className="h-4 w-4" />}
        onConfirm={() => approveRequest && handleApprove(approveRequest)}
      />
    </div>
  );
}
