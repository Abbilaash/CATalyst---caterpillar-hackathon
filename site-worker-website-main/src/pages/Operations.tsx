import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Plus,
  Eye,
  UserCog,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { assignOperator, fetchOperations, fetchAssets, fetchSchedulingData, completeOperation, reassignOperation } from '@/lib/api';

export function Operations() {
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [confirmComplete, setConfirmComplete] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const ops = await fetchOperations('mgr-01');
      const assets = await fetchAssets('mgr-01');
      const sched = await fetchSchedulingData('mgr-01');

      const mappedTasks = ops.map((op: any) => ({
        id: op.id,
        title: op.task,
        description: op.task,
        machineId: op.machineId,
        operatorId: op.operatorId,
        priority: op.priority === 'high' ? 'High' : op.priority === 'low' ? 'Low' : 'Medium',
        status: op.status === 'in_progress' ? 'In Progress' : op.status === 'completed' ? 'Completed' : 'Pending',
        progress: op.progress,
        startTime: op.expectedCompletion,
        expectedCompletion: op.expectedCompletion
      }));

      setTasksList(mappedTasks);
      setMachinesList(assets);
      setOperatorsList(sched.all_operators || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return tasksList.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tasksList, statusFilter, priorityFilter]);

  const handleComplete = async (taskId: string) => {
    const task = tasksList.find((t) => t.id === taskId);
    setConfirmComplete(null);
    try {
      await completeOperation(taskId);
      toast({
        title: 'Task marked complete',
        description: task ? `"${task.title}" has been marked as completed.` : 'Task completed.',
      });
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to complete task on server.',
        variant: 'destructive'
      });
    }
  };

  const handleReassign = async (taskId: string) => {
    const candidates = operatorsList.filter((op) => op.status === 'available' || op.status === 'on_duty');
    const operatorId = window.prompt(`Enter the new operator ID:\n${candidates.map((op) => `${op.name}: ${op.operator_id}`).join('\n')}`);
    if (!operatorId) return;
    try {
      await reassignOperation(taskId, operatorId);
      toast({ title: 'Operator reassigned', description: 'The operation has been updated.' });
      loadData();
    } catch (error) {
      toast({ title: 'Unable to reassign', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const handleCreateTask = async () => {
    const assetId = window.prompt(`Asset ID:\n${machinesList.map((asset) => `${asset.name}: ${asset.id}`).join('\n')}`);
    if (!assetId) return;
    const operatorId = window.prompt(`Operator ID:\n${operatorsList.map((operator) => `${operator.name}: ${operator.operator_id}`).join('\n')}`);
    if (!operatorId) return;
    const jobTitle = window.prompt('Task title');
    if (!jobTitle) return;
    const totalHours = Number(window.prompt('Duration in hours', '8'));
    if (!Number.isFinite(totalHours) || totalHours <= 0) {
      toast({ title: 'Invalid duration', description: 'Enter a positive number of hours.', variant: 'destructive' });
      return;
    }
    try {
      await assignOperator({
        asset_id: assetId,
        operator_id: operatorId,
        job_title: jobTitle,
        start_date: new Date().toISOString().slice(0, 10),
        start_time: new Date().toTimeString().slice(0, 5),
        total_hours: totalHours,
        site_id: 'site-01',
      });
      toast({ title: 'Task created', description: 'The operator and machine have been scheduled.' });
      loadData();
    } catch (error) {
      toast({ title: 'Unable to create task', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const stats = {
    total: tasksList.length,
    inProgress: tasksList.filter((t) => t.status === 'In Progress').length,
    completed: tasksList.filter((t) => t.status === 'Completed').length,
    delayed: tasksList.filter((t) => t.status === 'Delayed' || t.status === 'On Hold').length,
  };

  const getMachine = (id: string) => {
    const m = machinesList.find((asset: any) => asset.id === id || asset.machineId === id);
    if (!m) return null;
    return {
      id: m.id,
      name: m.name,
      machineId: m.machineId,
      image: `https://picsum.photos/seed/cat-${m.id}/600/400`
    };
  };

  const getOperator = (id: string | null) => {
    const op = operatorsList.find((o) => o.operator_id === id);
    if (!op) return null;
    return {
      name: op.name,
      avatar: `https://i.pravatar.cc/150?u=${op.operator_id}`,
      role: op.certified_equipment_types?.length ? `${op.certified_equipment_types[0]} Operator` : 'Operator'
    };
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
        title="Operations"
        description="Track and manage all site operations and tasks"
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreateTask}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Task
          </Button>
        }
      />

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total Tasks" value={stats.total} tone="text-foreground" />
        <MiniStat label="In Progress" value={stats.inProgress} tone="text-info" />
        <MiniStat label="Completed" value={stats.completed} tone="text-success" />
        <MiniStat label="Delayed / On Hold" value={stats.delayed} tone="text-destructive" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" /> Filter:
        </span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[150px] border-border bg-accent/40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Delayed">Delayed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-[150px] border-border bg-accent/40 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} tasks
        </span>
      </div>

      {/* Operation cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((task, i) => {
            const machine = getMachine(task.machineId);
            const operator = getOperator(task.operatorId);
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <Card className={cn(
                  'h-full border-border transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-black/20',
                  task.priority === 'Critical' && 'border-destructive/30',
                  task.status === 'Delayed' && 'border-destructive/30'
                )}>
                  <CardContent className="flex h-full flex-col p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                      </div>
                      <StatusChip status={task.priority} variant="priority" showIcon={false} />
                    </div>

                    {/* Machine + operator */}
                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        {machine && (
                          <img src={machine.image} alt="" className="h-8 w-10 rounded object-cover ring-1 ring-border" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">{machine?.name ?? 'Unassigned'}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{machine?.machineId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {operator ? (
                          <>
                            <img src={operator.avatar} alt={operator.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-border" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-foreground">{operator.name}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{operator.role}</p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-xs italic text-muted-foreground">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                              <UserCog className="h-3.5 w-3.5" />
                            </div>
                            Operator needed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium tabular-nums text-foreground">{task.progress}%</span>
                      </div>
                      <ProgressBar value={task.progress} size="sm" />
                    </div>

                    {/* Times */}
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                      <div>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> Started
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {new Date(task.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(task.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" /> Expected
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {new Date(task.expectedCompletion).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(task.expectedCompletion).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Status + actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <StatusChip status={task.status} showIcon={false} />
                      <div className="flex items-center gap-1">
                        {machine && (
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Link to={`/assets/${machine.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground hover:bg-info/15 hover:text-info"
                          onClick={() => handleReassign(task.id)}
                        >
                          <UserCog className="h-3.5 w-3.5" />
                        </Button>
                        {task.status !== 'Completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:bg-success/15 hover:text-success"
                            onClick={() => setConfirmComplete(task.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={confirmComplete !== null}
        onOpenChange={(o) => !o && setConfirmComplete(null)}
        title="Mark task complete?"
        description="This will mark the task as completed and update the operation records."
        confirmLabel="Mark Complete"
        icon={<CheckCircle2 className="h-4 w-4" />}
        onConfirm={() => confirmComplete && handleComplete(confirmComplete)}
      />
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn('mt-1 text-2xl font-bold tabular-nums', tone)}>{value}</p>
      </CardContent>
    </Card>
  );
}
