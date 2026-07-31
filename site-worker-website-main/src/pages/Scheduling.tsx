import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, ListPlus, Play, RotateCcw, Trash2, TriangleAlert, WandSparkles, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StatusChip } from '@/components/common/StatusChip';
import { useToast } from '@/hooks/use-toast';
import {
  assignOperator,
  cancelInterruptedOperation,
  cancelQueuedTask,
  checkInterruptions,
  commitAutoAssignments,
  fetchInterruptedOperations,
  fetchQueuedTasks,
  fetchSchedulingData,
  previewAutoAssignments,
  queueAutoAssignments,
  resumeInterruptedOperation,
} from '@/lib/api';

const MANAGER_ID = 'mgr-01';
const today = () => new Date().toISOString().slice(0, 10);

type DraftTask = {
  id: string;
  equipment_type: string;
  job_title: string;
  job_description: string;
  start_date: string;
  start_time: string;
  total_hours: number;
  importance: string;
  priority: boolean;
};

export function Scheduling() {
  const [data, setData] = useState<any>({ sites: [], all_operators: [], rented_assets: [], existing_assignments: [] });
  const [queue, setQueue] = useState<any[]>([]);
  const [interrupted, setInterrupted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState('site-01');
  const [manual, setManual] = useState({ asset_id: '', operator_id: '', job_title: '', start_date: today(), start_time: '08:00', total_hours: '8' });
  const [draft, setDraft] = useState<Omit<DraftTask, 'id'>>({ equipment_type: '', job_title: '', job_description: '', start_date: today(), start_time: '08:00', total_hours: 8, importance: 'medium', priority: false });
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [preview, setPreview] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [scheduling, queued, interruptions] = await Promise.all([
        fetchSchedulingData(MANAGER_ID),
        fetchQueuedTasks(MANAGER_ID),
        fetchInterruptedOperations(MANAGER_ID),
      ]);
      setData(scheduling);
      setQueue(queued);
      setInterrupted(interruptions);
      if (scheduling.sites?.[0] && !scheduling.sites.some((site: any) => site.site_id === siteId)) setSiteId(scheduling.sites[0].site_id);
      if (!draft.equipment_type && scheduling.rented_assets?.[0]) setDraft((current) => ({ ...current, equipment_type: scheduling.rented_assets[0].equipment_type }));
    } catch (error) {
      toast({ title: 'Scheduling data unavailable', description: error instanceof Error ? error.message : 'Could not load scheduling data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedAsset = useMemo(() => data.rented_assets.find((asset: any) => asset.asset_id === manual.asset_id), [data.rented_assets, manual.asset_id]);
  const selectedOperator = useMemo(() => data.all_operators.find((operator: any) => operator.operator_id === manual.operator_id), [data.all_operators, manual.operator_id]);
  const certified = !selectedAsset || !selectedOperator || (selectedOperator.certified_equipment_types || []).some((certificate: string) => selectedAsset.equipment_type.toLowerCase().includes(certificate.toLowerCase()) || certificate.toLowerCase().includes(selectedAsset.equipment_type.toLowerCase()));

  const createManualAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!certified) {
      toast({ title: 'Certification required', description: `${selectedOperator?.name} is not certified for this equipment.`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await assignOperator({ ...manual, total_hours: Number(manual.total_hours), site_id: siteId });
      toast({ title: 'Assignment created', description: 'The task is now on the schedule.' });
      setManual({ asset_id: '', operator_id: '', job_title: '', start_date: today(), start_time: '08:00', total_hours: '8' });
      load();
    } catch (error) {
      toast({ title: 'Unable to schedule task', description: error instanceof Error ? error.message : 'Please review the schedule conflict.', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const addDraft = () => {
    if (!draft.equipment_type || !draft.job_title || draft.total_hours <= 0) {
      toast({ title: 'Complete the task details', description: 'Equipment, title, and a positive duration are required.', variant: 'destructive' });
      return;
    }
    setDrafts((items) => [...items, { ...draft, id: crypto.randomUUID() }]);
    setDraft((current) => ({ ...current, job_title: '', job_description: '', priority: false }));
  };

  const runPreview = async (strategy: 'any' | 'fcfs') => {
    if (!drafts.length) return toast({ title: 'Add a task first', description: 'Create one or more draft tasks for auto-scheduling.', variant: 'destructive' });
    setSubmitting(true);
    try {
      setPreview(await previewAutoAssignments({ manager_id: MANAGER_ID, site_id: siteId, tasks: drafts.map(({ id, ...task }) => task), strategy }));
    } catch (error) {
      toast({ title: 'Auto-scheduling failed', description: error instanceof Error ? error.message : 'The solver could not prepare assignments.', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const commitPreview = async () => {
    if (!preview?.assignments?.length) return;
    setSubmitting(true);
    try {
      await commitAutoAssignments({ manager_id: MANAGER_ID, assignments: preview.assignments });
      toast({ title: 'Schedule committed', description: `${preview.assignments.length} assignments were created.` });
      setDrafts([]); setPreview(null); load();
    } catch (error) {
      toast({ title: 'Unable to commit schedule', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const queueTasks = async (tasks: DraftTask[]) => {
    if (!tasks.length) return;
    try {
      await queueAutoAssignments({ manager_id: MANAGER_ID, tasks: tasks.map(({ id, ...task }) => task) });
      toast({ title: 'Tasks queued', description: `${tasks.length} task${tasks.length === 1 ? '' : 's'} added to the backlog.` });
      setPreview(null); setDrafts([]); load();
    } catch (error) {
      toast({ title: 'Unable to queue tasks', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const queueUnassigned = async () => {
    const tasks = (preview?.unassigned_tasks || []).map((task: any) => {
      const start = new Date(task.start_time);
      return { id: crypto.randomUUID(), equipment_type: task.equipment_type, job_title: task.job_title, job_description: '', start_date: start.toISOString().slice(0, 10), start_time: start.toTimeString().slice(0, 5), total_hours: (new Date(task.end_time).getTime() - start.getTime()) / 3600000, importance: 'medium', priority: false };
    });
    await queueTasks(tasks);
  };

  const resolveInterruption = async (id: string, action: 'resume' | 'cancel') => {
    try {
      await (action === 'resume' ? resumeInterruptedOperation(id) : cancelInterruptedOperation(id));
      toast({ title: action === 'resume' ? 'Task re-queued' : 'Interrupted task cancelled' });
      load();
    } catch (error) { toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' }); }
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return <div className="space-y-6">
    <PageHeader title="Scheduling" description="Plan work, match certified operators, and optimize fleet utilization" icon={<CalendarClock className="h-5 w-5" />} actions={<Button variant="outline" onClick={async () => { await checkInterruptions(MANAGER_ID); load(); }}><TriangleAlert className="mr-1.5 h-4 w-4" /> Check interruptions</Button>} />

    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-border"><CardHeader><CardTitle className="text-base">Manual assignment</CardTitle></CardHeader><CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={createManualAssignment}>
          <Field label="Site"><Select value={siteId} onValueChange={setSiteId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.sites.map((site: any) => <SelectItem key={site.site_id} value={site.site_id}>{site.site_name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Task title"><Input value={manual.job_title} onChange={(event) => setManual({ ...manual, job_title: event.target.value })} required /></Field>
          <Field label="Asset"><Select value={manual.asset_id} onValueChange={(asset_id) => setManual({ ...manual, asset_id })}><SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger><SelectContent>{data.rented_assets.map((asset: any) => <SelectItem key={asset.asset_id} value={asset.asset_id}>{asset.asset_name} · {asset.equipment_type}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Operator"><Select value={manual.operator_id} onValueChange={(operator_id) => setManual({ ...manual, operator_id })}><SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger><SelectContent>{data.all_operators.map((operator: any) => <SelectItem key={operator.operator_id} value={operator.operator_id}>{operator.name} · {operator.status}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Date"><Input type="date" value={manual.start_date} onChange={(event) => setManual({ ...manual, start_date: event.target.value })} required /></Field><Field label="Start time"><Input type="time" value={manual.start_time} onChange={(event) => setManual({ ...manual, start_time: event.target.value })} required /></Field>
          <Field label="Hours"><Input type="number" min="0.5" step="0.5" value={manual.total_hours} onChange={(event) => setManual({ ...manual, total_hours: event.target.value })} required /></Field>
          <div className="flex items-end"><Button type="submit" disabled={submitting} className="w-full"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Schedule task</Button></div>
          {selectedAsset && selectedOperator && <p className={`sm:col-span-2 text-xs ${certified ? 'text-success' : 'text-destructive'}`}>{certified ? 'Operator certification is compatible with selected equipment.' : 'Selected operator is not certified for this equipment.'}</p>}
        </form>
      </CardContent></Card>

      <Card className="border-border"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><WandSparkles className="h-4 w-4 text-primary" /> Auto-scheduling batch</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Equipment type"><Select value={draft.equipment_type} onValueChange={(equipment_type) => setDraft({ ...draft, equipment_type })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{[...new Set<string>(data.rented_assets.map((asset: any) => asset.equipment_type as string))].filter(Boolean).map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field><Field label="Task title"><Input value={draft.job_title} onChange={(event) => setDraft({ ...draft, job_title: event.target.value })} /></Field><Field label="Date"><Input type="date" value={draft.start_date} onChange={(event) => setDraft({ ...draft, start_date: event.target.value })} /></Field><Field label="Time"><Input type="time" value={draft.start_time} onChange={(event) => setDraft({ ...draft, start_time: event.target.value })} /></Field><Field label="Hours"><Input type="number" min="0.5" step="0.5" value={draft.total_hours} onChange={(event) => setDraft({ ...draft, total_hours: Number(event.target.value) })} /></Field><Field label="Importance"><Select value={draft.importance} onValueChange={(importance) => setDraft({ ...draft, importance })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></Field></div>
        <Field label="Description"><Textarea value={draft.job_description} onChange={(event) => setDraft({ ...draft, job_description: event.target.value })} /></Field>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={addDraft}><ListPlus className="mr-1.5 h-4 w-4" /> Add to batch</Button><Button type="button" onClick={() => runPreview('any')} disabled={submitting}><Play className="mr-1.5 h-4 w-4" /> Optimize</Button><Button type="button" variant="secondary" onClick={() => runPreview('fcfs')} disabled={submitting}>First come, first served</Button></div>
        {drafts.length > 0 && <div className="space-y-2 border-t border-border pt-3">{drafts.map((task) => <div key={task.id} className="flex items-center justify-between rounded-md bg-accent/40 p-2 text-sm"><span>{task.job_title} · {task.equipment_type} · {task.total_hours}h</span><Button size="icon" variant="ghost" onClick={() => setDrafts((items) => items.filter((item) => item.id !== task.id))}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
      </CardContent></Card>
    </div>

    {preview && <Card className="border-primary/40"><CardHeader><CardTitle className="text-base">Optimization preview</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2">{preview.assignments?.map((assignment: any) => <div key={`${assignment.asset_id}-${assignment.job_title}`} className="rounded-lg border border-success/30 bg-success/5 p-3"><p className="font-medium">{assignment.job_title}</p><p className="text-sm text-muted-foreground">{assignment.asset_name} → {assignment.operator_name}</p><p className="text-xs text-muted-foreground">{new Date(assignment.start_time).toLocaleString()} – {new Date(assignment.end_time).toLocaleTimeString()}</p></div>)}</div>{preview.unassigned_tasks?.length > 0 && <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"><p className="font-medium">{preview.unassigned_tasks.length} task(s) could not be matched.</p><p className="text-muted-foreground">Queue them to automatically schedule when compatible resources are available.</p></div>}<div className="flex flex-wrap gap-2"><Button onClick={commitPreview} disabled={!preview.assignments?.length || submitting}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Commit assignments</Button>{preview.unassigned_tasks?.length > 0 && <Button variant="outline" onClick={queueUnassigned}><Clock3 className="mr-1.5 h-4 w-4" /> Queue unmatched</Button>}</div></CardContent></Card>}

    <div className="grid gap-6 xl:grid-cols-2"><TaskList title={`Queued backlog (${queue.length})`} empty="No tasks are waiting in the backlog." items={queue} render={(task: any) => <div className="flex items-center justify-between"><div><p className="font-medium">{task.job_title}</p><p className="text-xs text-muted-foreground">{task.equipment_type} · {task.total_hours}h · {new Date(task.start_time).toLocaleString()}</p></div><Button size="sm" variant="ghost" onClick={async () => { await cancelQueuedTask(task.queue_id); load(); }}><Trash2 className="mr-1 h-4 w-4" /> Cancel</Button></div>} /><TaskList title={`Interrupted work (${interrupted.length})`} empty="No interrupted assignments." items={interrupted} render={(task: any) => <div className="flex items-center justify-between gap-3"><div><p className="font-medium">{task.job_title}</p><p className="text-xs text-muted-foreground">{task.asset_name} · {task.interrupt_reason}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => resolveInterruption(task.interrupt_id, 'resume')}><RotateCcw className="mr-1 h-3.5 w-3.5" /> Resume</Button><Button size="icon" variant="ghost" onClick={() => resolveInterruption(task.interrupt_id, 'cancel')}><XCircle className="h-4 w-4" /></Button></div></div>} /></div>

    <Card className="border-border"><CardHeader><CardTitle className="text-base">Current schedule</CardTitle></CardHeader><CardContent className="space-y-2">{data.existing_assignments.length ? data.existing_assignments.map((assignment: any) => <div key={assignment.assignment_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 p-3"><div><p className="font-medium">{assignment.job_title}</p><p className="text-sm text-muted-foreground">{assignment.asset_name} · {assignment.operator_name}</p></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{new Date(assignment.start_time).toLocaleString()} – {new Date(assignment.end_time).toLocaleTimeString()}</span><StatusChip status={assignment.status} showIcon={false} /></div></div>) : <p className="text-sm text-muted-foreground">No active or scheduled assignments.</p>}</CardContent></Card>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>; }
function TaskList({ title, empty, items, render }: { title: string; empty: string; items: any[]; render: (item: any) => React.ReactNode }) { return <Card className="border-border"><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-2">{items.length ? items.map((item) => <div key={item.queue_id || item.interrupt_id} className="rounded-lg border border-border/70 p-3">{render(item)}</div>) : <p className="text-sm text-muted-foreground">{empty}</p>}</CardContent></Card>; }
