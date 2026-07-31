import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Play, Pause, Check, Clock, Cpu, ListChecks, X, QrCode } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/States';
import { priorityColor, prioritySoftColor, priorityLabel, taskStatusLabel, taskStatusColor } from '@/theme/status';
import type { TaskStatus } from '@/types';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

const FILTERS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Done' },
];

export default function OperatorTasks() {
  const { managerId } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [startingTask, setStartingTask] = useState<any>(null);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [simulatingScan, setSimulatingScan] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const resolvedOpId = managerId || 'operator-01';
      const res = await fetch(`${API_BASE_URL}/api/v1/operator/${resolvedOpId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data || []).sort((a: any, b: any) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return 0;
        });
        setTasks(sorted);
      }
    } catch (e) {
      console.warn('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [managerId]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/operator/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadTasks();
      } else {
        Alert.alert('Error', 'Failed to update status on server.');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection error.');
    }
  };

  const handleStartPress = (task: any) => {
    setStartingTask(task);
    setQrCodeInput('');
    setScanModalVisible(true);
  };

  const handleSimulateScan = () => {
    if (!startingTask) return;
    setSimulatingScan(true);
    setTimeout(() => {
      setQrCodeInput(startingTask.qrCode || '');
      setSimulatingScan(false);
    }, 1200);
  };

  const handleVerifyAndStart = async () => {
    if (!startingTask) return;
    if (qrCodeInput.trim() !== (startingTask.qrCode || '').trim()) {
      Alert.alert('Authentication Failure', 'The scanned QR code does not match the assigned asset for this task.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/operator/tasks/${startingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Asset verified. Task is now in progress.');
        setScanModalVisible(false);
        setStartingTask(null);
        setQrCodeInput('');
        loadTasks();
      } else {
        Alert.alert('Error', 'Failed to update task status.');
      }
    } catch (e) {
      Alert.alert('Error', 'Connection error.');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <Screen>
        <OperatorShell active="tasks">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={PALETTE.catYellow} />
          </View>
        </OperatorShell>
      </Screen>
    );
  }

  return (
    <Screen>
      <OperatorShell active="tasks">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="My Tasks" subtitle={`${filtered.length} task${filtered.length === 1 ? '' : 's'}`} onBell={() => {}} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} style={({ pressed }) => [styles.filterChip, filter === f.key && styles.filterChipActive, pressed && styles.pressed]}>
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
                  onStart={() => handleStartPress(task)}
                  onPause={() => updateStatus(task.id, 'paused')}
                  onComplete={() => updateStatus(task.id, 'completed')}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <Modal animationType="slide" transparent visible={scanModalVisible} onRequestClose={() => setScanModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: 420 }]}> 
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Verify Asset QR</Text>
                <Pressable onPress={() => { setScanModalVisible(false); setStartingTask(null); }}>
                  <X size={20} color={PALETTE.textSecondary} />
                </Pressable>
              </View>

              {startingTask && (
                <View style={[styles.form, { gap: SPACING.md, marginTop: SPACING.lg }]}> 
                  <Text style={{ fontSize: 13, color: PALETTE.textSecondary, textAlign: 'center' }}>
                    Scan the asset QR code linked to <Text style={{ color: PALETTE.textPrimary, fontFamily: FONT.bold }}>{startingTask.machineName}</Text> before starting this task.
                  </Text>
                  <View style={[styles.scannerBox, simulatingScan && { borderColor: PALETTE.catYellow }]}> 
                    <QrCode size={56} color={simulatingScan ? PALETTE.catYellow : PALETTE.textTertiary} opacity={simulatingScan ? 1.0 : 0.6} />
                    {simulatingScan && <ActivityIndicator size="small" color={PALETTE.catYellow} style={{ marginTop: 8 }} />}
                  </View>
                  <Pressable onPress={handleSimulateScan} style={[styles.actBtn, { backgroundColor: PALETTE.surfaceOverlay, borderColor: PALETTE.borderStrong, height: 48 }]}> 
                    <Text style={{ color: PALETTE.catYellow, fontFamily: FONT.bold, fontSize: 11 }}>Simulate Scan</Text>
                  </Pressable>
                  <TextInput style={styles.textInput} value={qrCodeInput} onChangeText={setQrCodeInput} placeholder="Scanned QR code value" placeholderTextColor={PALETTE.textTertiary} autoCapitalize="characters" />
                  <Pressable style={styles.solveBtn} onPress={handleVerifyAndStart}>
                    <Text style={styles.solveBtnText}>Verify & Start Working</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </OperatorShell>
    </Screen>
  );
}

function TaskCard({ task, onStart, onPause, onComplete }: { task: any; onStart: () => void; onPause: () => void; onComplete: () => void }) {
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
            <Cpu size={13} color={PALETTE.textSecondary} strokeWidth={2} />
            <Text style={styles.taskMachine}>{task.machineName} ({task.machineId})</Text>
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
        {!isCompleted && !isActive && <ActionButton icon={<Play size={15} color={PALETTE.textInverse} strokeWidth={2.6} />} label="Start" solid onPress={onStart} />}
        {isActive && <ActionButton icon={<Pause size={15} color={PALETTE.textPrimary} strokeWidth={2.6} />} label="Pause" outline onPress={onPause} />}
        {!isCompleted && <ActionButton icon={<Check size={15} color={PALETTE.success} strokeWidth={2.6} />} label="Complete" outline accent={PALETTE.success} onPress={onComplete} disabled={!isActive && !isPaused} />}
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
  taskActions: { flexDirection: 'row', gap: SPACING.sm },
  actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: RADIUS.md, borderWidth: 1 },
  actLabel: { fontFamily: FONT.semibold, fontSize: 13 },
  actDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: PALETTE.bg, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: PALETTE.border, paddingBottom: SPACING.md },
  modalTitle: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary },
  form: { gap: SPACING.md, marginTop: SPACING.md, paddingBottom: SPACING.xl },
  textInput: { height: 48, borderRadius: RADIUS.md, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, paddingHorizontal: SPACING.md, color: PALETTE.textPrimary, fontFamily: FONT.regular },
  solveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PALETTE.catYellow, height: 50, borderRadius: RADIUS.md, marginTop: SPACING.md },
  solveBtnText: { fontFamily: FONT.bold, fontSize: 14, color: PALETTE.bg },
  scannerBox: { height: 120, backgroundColor: '#0C0E10', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: PALETTE.border, alignItems: 'center', justifyContent: 'center', marginVertical: SPACING.xs },
});
