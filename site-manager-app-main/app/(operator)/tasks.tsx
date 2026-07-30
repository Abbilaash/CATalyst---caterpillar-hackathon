import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Play, Pause, Check, Clock, Cpu, ListChecks, Filter,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Fab } from '@/components/Fab';
import { EmptyState } from '@/components/States';
import { CURRENT_TASKS, assetByMachineId } from '@/data/mock';
import { priorityColor, prioritySoftColor, priorityLabel, taskStatusLabel, taskStatusColor } from '@/theme/status';
import type { Task, TaskStatus } from '@/types';

const FILTERS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Done' },
];

export default function OperatorTasks() {
  const [tasks, setTasks] = useState<Task[]>(CURRENT_TASKS);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  return (
    <Screen>
      <OperatorShell active="tasks">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="My Tasks" subtitle={`${filtered.length} task${filtered.length === 1 ? '' : 's'}`} onBell={() => {}} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [styles.filterChip, filter === f.key && styles.filterChipActive, pressed && styles.pressed]}
              >
                <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <EmptyState Icon={ListChecks} />
          ) : (
            <View style={styles.list}>
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={() => updateStatus(task.id, 'in_progress')}
                  onPause={() => updateStatus(task.id, 'paused')}
                  onComplete={() => updateStatus(task.id, 'completed')}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </OperatorShell>
    </Screen>
  );
}

function TaskCard({
  task,
  onStart,
  onPause,
  onComplete,
}: {
  task: Task;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
}) {
  const asset = assetByMachineId(task.machineId);
  const accent = priorityColor(task.priority);
  const isCompleted = task.status === 'completed';
  const isActive = task.status === 'in_progress';
  const isPaused = task.status === 'paused';

  return (
    <Card style={[styles.taskCard, { borderLeftColor: accent, borderLeftWidth: 3 }] as any}>
      <View style={styles.taskTop}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.taskName} numberOfLines={2}>{task.name}</Text>
          <View style={styles.taskMetaRow}>
            <Cpu size={13} color={PALETTE.textTertiary} strokeWidth={2} />
            <Text style={styles.taskMachine}>{asset?.name ?? task.machineId}</Text>
          </View>
        </View>
        <Chip label={priorityLabel(task.priority)} color={accent} soft={prioritySoftColor(task.priority)} dot />
      </View>

      <View style={styles.taskChips}>
        <Chip label={taskStatusLabel(task.status)} color={taskStatusColor(task.status)} soft={`${taskStatusColor(task.status)}22`} dot />
        <View style={styles.dueChip}>
          <Clock size={12} color={PALETTE.textSecondary} strokeWidth={2.2} />
          <Text style={styles.dueText}>Due {task.dueTime}</Text>
        </View>
      </View>



      <View style={styles.taskActions}>
        {!isCompleted && !isActive && (
          <ActionButton icon={<Play size={15} color={PALETTE.textInverse} strokeWidth={2.6} />} label="Start" solid onPress={onStart} />
        )}
        {isActive && (
          <ActionButton icon={<Pause size={15} color={PALETTE.textPrimary} strokeWidth={2.6} />} label="Pause" outline onPress={onPause} />
        )}
        {!isCompleted && (
          <ActionButton icon={<Check size={15} color={PALETTE.success} strokeWidth={2.6} />} label="Complete" outline accent={PALETTE.success} onPress={onComplete} disabled={!isActive && !isPaused} />
        )}
      </View>
    </Card>
  );
}

function ActionButton({ icon, label, solid, outline, accent, onPress, disabled }: any) {
  const bg = solid ? PALETTE.catYellow : 'transparent';
  const fg = solid ? PALETTE.textInverse : accent ?? PALETTE.textPrimary;
  const border = outline ? (accent ?? PALETTE.borderStrong) : 'transparent';
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.actBtn, { backgroundColor: bg, borderColor: border }, disabled && styles.actDisabled, pressed && styles.pressed]}>
      {icon}
      <Text style={[styles.actLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  filterRow: { gap: SPACING.sm, paddingHorizontal: SPACING.xs },
  filterChip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.pill, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border },
  filterChipActive: { backgroundColor: PALETTE.catYellowSoft, borderColor: PALETTE.catYellowBorder },
  filterLabel: { fontFamily: FONT.medium, fontSize: 13, color: PALETTE.textSecondary },
  filterLabelActive: { color: PALETTE.catYellow },
  list: { gap: SPACING.md },
  taskCard: { gap: SPACING.md },
  taskTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  taskName: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.textPrimary, lineHeight: 20 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  taskMachine: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  taskChips: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dueChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.sm, paddingVertical: 4, paddingHorizontal: SPACING.sm },
  dueText: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
  progressWrap: { paddingTop: SPACING.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PALETTE.border, marginTop: SPACING.xs },
  taskActions: { flexDirection: 'row', gap: SPACING.sm },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: RADIUS.md, borderWidth: 1 },
  actLabel: { fontFamily: FONT.semibold, fontSize: 13 },
  actDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
