import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Phone,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Shield,
  Construction,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { fetchSchedulingData, fetchAssets, fetchOperations } from '@/lib/api';

export function OperatorDetails() {
  const { id } = useParams();
  const [operator, setOperator] = useState<any>(null);
  const [assignedMachine, setAssignedMachine] = useState<any>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const schedData = await fetchSchedulingData('mgr-01');
        const assetsData = await fetchAssets('mgr-01');
        const opsData = await fetchOperations('mgr-01');

        const op = (schedData.all_operators || []).find((o: any) => o.operator_id === id);
        if (!op) {
          setLoading(false);
          return;
        }

        const activeTask = opsData.find((opTask: any) => opTask.operatorId === id && opTask.status === 'in_progress');

        const mappedOperator = {
          id: op.operator_id,
          employeeId: op.license_number || `EMP-${op.operator_id.slice(0, 4).upper()}`,
          name: op.name,
          role: op.certified_equipment_types?.length ? `${op.certified_equipment_types.join(', ')} Operator` : 'General Operator',
          avatar: `https://i.pravatar.cc/150?u=${op.operator_id}`,
          assignedMachineId: activeTask ? activeTask.machineId : null,
          currentTask: activeTask ? activeTask.task : null,
          shift: op.status === 'on_duty' ? 'On Shift' : 'Off Shift',
          experienceYears: op.experience_years,
          safetyScore: 95,
          performance: 90,
          completedTasks: opsData.filter((t: any) => t.operatorId === id && t.status === 'completed').length,
          openTasks: opsData.filter((t: any) => t.operatorId === id && t.status !== 'completed').length,
          availability: activeTask ? 'On Task' : op.status === 'on_duty' ? 'Available' : 'Unavailable',
          phone: '(555) 210-' + op.operator_id.slice(-4),
          certifications: op.certified_equipment_types || ['OSHA 30'],
          hireDate: '2020-01-15',
          hoursThisWeek: 35,
          hoursTotal: 4800
        };

        setOperator(mappedOperator);

        if (activeTask) {
          const matchAsset = assetsData.find((a: any) => a.machineId === activeTask.machineId);
          if (matchAsset) {
            setAssignedMachine({
              id: matchAsset.id,
              name: matchAsset.name,
              machineId: matchAsset.machineId,
              image: `https://picsum.photos/seed/cat-${matchAsset.id}/600/400`,
              rentalStatus: matchAsset.rentalStatus === 'active' ? 'Active' : 'Available',
              engineHours: matchAsset.engineHours
            });
          }
        }

        const opTasks = opsData.filter((t: any) => t.operatorId === id).map((t: any) => {
          const m = assetsData.find((asset: any) => asset.machineId === t.machineId);
          return {
            id: t.id,
            title: t.task,
            machineId: t.machineId,
            machineName: m ? m.name : 'Unknown Equipment',
            progress: t.progress,
            status: t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending',
            expectedCompletion: t.expectedCompletion
          };
        });

        setActiveTasks(opTasks.filter((t: any) => t.status !== 'Completed'));
        setCompletedTasks(opTasks.filter((t: any) => t.status === 'Completed'));
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

  if (!operator) {
    return (
      <EmptyState
        title="Operator not found"
        description="This operator doesn't exist or has been removed."
        action={{ label: 'Back to Operators', to: '/operators' }}
      />
    );
  }

  const safetyHistory = [
    { id: 'sh1', date: '2026-07-18', event: 'Safety briefing completed', severity: 'info' as const },
    { id: 'sh2', date: '2026-06-22', event: 'Near-miss reported — load swing', severity: 'warning' as const },
    { id: 'sh3', date: '2026-05-10', event: 'Quarterly safety inspection passed', severity: 'success' as const },
    { id: 'sh4', date: '2026-03-14', event: 'OSHA 30 renewal completed', severity: 'info' as const },
  ];

  const weeklyHours = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 9 },
    { day: 'Wed', hours: 8 },
    { day: 'Thu', hours: 9 },
    { day: 'Fri', hours: 8 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={operator.name}
        description={`${operator.role} · ${operator.employeeId}`}
        icon={<Users className="h-5 w-5" />}
        backTo="/operators"
        backLabel="Back to Operators"
        actions={
          <>
            <StatusChip status={operator.shift} />
            <StatusChip status={operator.availability} showIcon={false} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <img src={operator.avatar} alt={operator.name} className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/30" />
              <h2 className="mt-4 text-lg font-bold text-foreground">{operator.name}</h2>
              <p className="text-sm text-muted-foreground">{operator.role}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {operator.certifications.map((c: string) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full border border-border bg-accent/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                    <Award className="h-3 w-3 text-primary" /> {c}
                  </span>
                ))}
              </div>
              <div className="mt-5 w-full space-y-3 border-t border-border pt-5 text-left">
                <DetailRow icon={Phone} label="Phone" value={operator.phone} />
                <DetailRow icon={Calendar} label="Hired" value={new Date(operator.hireDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
                <DetailRow icon={Clock} label="Experience" value={`${operator.experienceYears} years`} />
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PerfRow label="Safety Score" value={operator.safetyScore} tone={operator.safetyScore >= 95 ? 'success' : 'primary'} icon={Shield} />
              <PerfRow label="Productivity" value={operator.performance} tone={operator.performance >= 90 ? 'success' : 'primary'} icon={TrendingUp} />
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div className="rounded-lg bg-accent/40 p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{operator.completedTasks}</p>
                  <p className="text-[11px] text-muted-foreground">Completed</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-3 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{operator.openTasks}</p>
                  <p className="text-[11px] text-muted-foreground">Open Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours worked */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-info" /> Hours This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums text-foreground">{operator.hoursThisWeek}<span className="text-base text-muted-foreground">h</span></p>
                  <p className="text-xs text-muted-foreground">of 40h target</p>
                </div>
                <span className={cn('text-xs font-medium', operator.hoursThisWeek >= 40 ? 'text-warning' : 'text-success')}>
                  {operator.hoursThisWeek >= 40 ? 'Overtime' : 'On track'}
                </span>
              </div>
              <div className="flex items-end justify-between gap-1.5 pt-2">
                {weeklyHours.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end justify-center" style={{ height: '60px' }}>
                      <div
                        className={cn('w-full max-w-[18px] rounded-t', d.hours > 0 ? 'bg-primary' : 'bg-muted')}
                        style={{ height: `${(d.hours / 9) * 100}%`, minHeight: d.hours > 0 ? '4px' : '2px' }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.day[0]}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">Total career hours</span>
                <span className="font-medium tabular-nums text-foreground">{operator.hoursTotal.toLocaleString()}h</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Assigned equipment */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Construction className="h-4 w-4 text-primary" /> Assigned Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedMachine ? (
                <Link to={`/assets/${assignedMachine.id}`} className="flex items-center gap-4 rounded-lg border border-border/60 bg-accent/30 p-4 transition-colors hover:bg-accent/60">
                  <img src={assignedMachine.image} alt={assignedMachine.name} className="h-16 w-20 rounded-md object-cover ring-1 ring-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{assignedMachine.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{assignedMachine.machineId}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusChip status={assignedMachine.rentalStatus} showIcon={false} />
                      <span className="text-xs text-muted-foreground">{assignedMachine.engineHours.toLocaleString()} hrs</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-3 text-sm text-muted-foreground">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                    <Construction className="h-5 w-5" />
                  </div>
                  <span className="italic">No equipment currently assigned</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current tasks */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4 text-info" /> Current Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeTasks.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No active tasks</p>
              ) : (
                activeTasks.map((t) => {
                  return (
                    <div key={t.id} className="rounded-lg border border-border/60 bg-accent/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{t.machineName}</p>
                        </div>
                        <StatusChip status={t.status} showIcon={false} />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <ProgressBar value={t.progress} size="sm" />
                        <span className="text-xs tabular-nums text-muted-foreground">{t.progress}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Completed tasks */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4 text-success" /> Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedTasks.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">No completed tasks</p>
              ) : (
                completedTasks.map((t) => {
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-accent/20 p-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.machineName}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(t.expectedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Safety history */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-warning" /> Safety History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-1">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                {safetyHistory.map((s) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative flex gap-3 rounded-lg p-2"
                  >
                    <div className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
                      s.severity === 'success' && 'bg-success/15 text-success',
                      s.severity === 'warning' && 'bg-warning/15 text-warning',
                      s.severity === 'info' && 'bg-info/15 text-info'
                    )}>
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-sm text-foreground">{s.event}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function PerfRow({ icon: Icon, label, value, tone }: { icon: typeof Shield; label: string; value: number; tone: 'success' | 'primary'; }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className={cn('h-4 w-4', tone === 'success' ? 'text-success' : 'text-primary')} /> {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <ProgressBar value={value} size="sm" tone={tone} />
    </div>
  );
}
