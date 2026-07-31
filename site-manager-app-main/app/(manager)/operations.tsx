import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Activity, Eye, UserCog, CheckCircle2, Clock, Cpu, X, Trash2 } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/States';
import { priorityColor, prioritySoftColor, priorityLabel, taskStatusLabel, taskStatusColor } from '@/theme/status';
import type { Operation } from '@/types';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function ManagerOperations() {
  const { managerId } = useSession();
  const [operations, setOperations] = useState<any[]>([]);
  const [detail, setDetail] = useState<any | null>(null);
  const [reassign, setReassign] = useState<any | null>(null);
  const [complete, setComplete] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const resolvedManagerId = managerId || 'mgr-01';
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/operations/${resolvedManagerId}`);
      if (response.ok) {
        const data = await response.json();
        setOperations(data || []);
      }
    } catch (err) {
      console.warn('Failed to load operations from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [managerId]);

  const markComplete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/operations/${id}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        Alert.alert('Success', 'Operation marked complete and asset released.');
        fetchOperations();
      }
    } catch (err) {
      console.warn('Error completing task:', err);
    }
    setComplete(null);
  };

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/manager/operations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        Alert.alert('Success', 'Operation successfully deleted.');
        fetchOperations();
      } else {
        Alert.alert('Error', 'Failed to delete operation from server.');
      }
    } catch (err) {
      console.warn('Error deleting task:', err);
    }
    setDeleteTarget(null);
  };

  const reassignOp = async (id: string) => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      const res = await fetch(`${API_BASE_URL}/api/v1/manager/scheduling-data/${resolvedManagerId}`);
      if (res.ok) {
        const data = await res.json();
        const currentOpId = reassign?.operatorId;
        const targetOp = data.free_operators?.find((o: any) => o.operator_id !== currentOpId) || data.all_operators?.find((o: any) => o.operator_id !== currentOpId);
        
        if (!targetOp) {
          Alert.alert('Error', 'No alternative operators found to reassign to.');
          setReassign(null);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/manager/operations/${id}/reassign?operator_id=${targetOp.operator_id}`, {
          method: 'POST',
        });
        if (response.ok) {
          Alert.alert('Success', `Operation successfully reassigned to ${targetOp.name}`);
          fetchOperations();
        }
      }
    } catch (err) {
      console.warn('Error reassigning operator:', err);
    }
    setReassign(null);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.catYellow} />
          <Text style={styles.loadingText}>Loading operations...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ManagerShell active="operations">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Operations" subtitle={`${operations.length} total activities`} onBell={() => {}} />

          <View style={styles.summaryBar}>
            <SummaryPill label="In Progress" value={operations.filter((o) => o.status === 'in_progress').length} color={PALETTE.info} />
            <SummaryPill label="Paused" value={operations.filter((o) => o.status === 'paused').length} color={PALETTE.warning} />
            <SummaryPill label="Completed" value={operations.filter((o) => o.status === 'completed').length} color={PALETTE.success} />
          </View>

          {operations.length === 0 ? (
            <EmptyState Icon={Activity} />
          ) : (
            <View style={styles.list}>
              {operations.map((op) => (
                <OperationCard
                  key={op.id}
                  op={op}
                  onView={() => setDetail(op)}
                  onReassign={() => setReassign(op)}
                  onComplete={() => setComplete(op)}
                  onDelete={() => setDeleteTarget(op)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ManagerShell>

      {detail && <DetailSheet op={detail} onClose={() => setDetail(null)} />}

      <ConfirmDialog
        visible={reassign !== null}
        title="Reassign Operation"
        message="Reassign this operation to an available operator? The current operator will be released from this task."
        confirmLabel="Reassign"
        onConfirm={() => reassign && reassignOp(reassign.id)}
        onCancel={() => setReassign(null)}
      />
      <ConfirmDialog
        visible={complete !== null}
        title="Mark Complete"
        message="Mark this operation as complete? This will finalize the task and release the equipment."
        confirmLabel="Complete"
        onConfirm={() => complete && markComplete(complete.id)}
        onCancel={() => setComplete(null)}
      />
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Operation"
        message="Delete this operation permanently? This will remove all records from the database."
        confirmLabel="Delete"
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

function OperationCard({ op, onView, onReassign, onComplete, onDelete }: { op: any; onView: () => void; onReassign: () => void; onComplete: () => void; onDelete: () => void }) {
  const accent = priorityColor(op.priority);
  const isCompleted = op.status === 'completed';

  return (
    <Card style={[styles.opCard, { borderLeftColor: accent, borderLeftWidth: 3 }] as any}>
      <View style={styles.opTop}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.opName} numberOfLines={2}>{op.task}</Text>
          <View style={styles.opMetaRow}>
            <Cpu size={13} color={PALETTE.textTertiary} strokeWidth={2} />
            <Text style={styles.opMachine}>{op.machineName || op.machineId}</Text>
          </View>
        </View>
        <Chip label={priorityLabel(op.priority)} color={accent} soft={prioritySoftColor(op.priority)} dot />
      </View>

      <View style={styles.opOperator}>
        <Avatar name={op.operatorName} size={28} />
        <Text style={styles.opOperatorName}>{op.operatorName || 'Unassigned'}</Text>
        <Chip label={taskStatusLabel(op.status)} color={taskStatusColor(op.status)} soft={`${taskStatusColor(op.status)}22`} dot />
        <View style={styles.dueChip}>
          <Clock size={12} color={PALETTE.textSecondary} strokeWidth={2.2} />
          <Text style={styles.dueText}>ETA {op.expectedCompletion}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={[styles.progressValue, { color: isCompleted ? PALETTE.success : accent }]}>{op.progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${op.progress}%`, backgroundColor: isCompleted ? PALETTE.success : accent }]} />
        </View>
      </View>

      <View style={styles.opActions}>
        <OpButton icon={<Eye size={15} color={PALETTE.textPrimary} strokeWidth={2.2} />} label="Details" outline onPress={onView} />
        <OpButton icon={<UserCog size={15} color={PALETTE.info} strokeWidth={2.2} />} label="Reassign" outline accent={PALETTE.info} onPress={onReassign} disabled={isCompleted} />
        <OpButton icon={<CheckCircle2 size={15} color={PALETTE.success} strokeWidth={2.2} />} label="Complete" outline accent={PALETTE.success} onPress={onComplete} disabled={isCompleted} />
        <OpButton icon={<Trash2 size={15} color={PALETTE.error} strokeWidth={2.2} />} outline accent={PALETTE.error} onPress={onDelete} />
      </View>
    </Card>
  );
}

function OpButton({ icon, label, outline, accent, onPress, disabled }: any) {
  const border = outline ? (accent ?? PALETTE.borderStrong) : 'transparent';
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.opBtn, { borderColor: border }, disabled && styles.opDisabled, pressed && styles.pressed]}>
      {icon}
      {label ? <Text style={[styles.opBtnLabel, { color: accent ?? PALETTE.textPrimary }]}>{label}</Text> : null}
    </Pressable>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.summaryPill, { borderColor: color + '40' }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DetailSheet({ op, onClose }: { op: any; onClose: () => void }) {
  return (
    <View style={styles.sheetBackdrop}>
      <Pressable style={styles.sheetBackdropPress} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.sheetTitle}>{op.task}</Text>
            <Text style={styles.sheetMeta}>{op.machineName} · {op.machineId}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose}>
            <X size={18} color={PALETTE.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={styles.sheetChips}>
          <Chip label={priorityLabel(op.priority)} color={priorityColor(op.priority)} soft={prioritySoftColor(op.priority)} dot />
          <Chip label={taskStatusLabel(op.status)} color={taskStatusColor(op.status)} soft={`${taskStatusColor(op.status)}22`} dot />
        </View>
        <View style={styles.sheetOperatorRow}>
          <Avatar name={op.operatorName} size={44} showRing />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetOperatorLabel}>Assigned Operator</Text>
            <Text style={styles.sheetOperatorName}>{op.operatorName || 'Unassigned'}</Text>
          </View>
        </View>
        <View style={styles.sheetProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Completion</Text>
            <Text style={[styles.progressValue, { color: op.status === 'completed' ? PALETTE.success : priorityColor(op.priority) }]}>{op.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${op.progress}%`, backgroundColor: op.status === 'completed' ? PALETTE.success : priorityColor(op.priority) }]} />
          </View>
        </View>
        <View style={styles.sheetInfoRow}>
          <View style={styles.sheetInfoBox}>
            <Clock size={16} color={PALETTE.catYellow} strokeWidth={2.2} />
            <Text style={styles.sheetInfoLabel}>Expected Completion</Text>
            <Text style={styles.sheetInfoValue}>{op.expectedCompletion}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.bg },
  loadingText: { marginTop: SPACING.md, fontFamily: FONT.medium, fontSize: 14, color: PALETTE.textSecondary },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  summaryBar: { flexDirection: 'row', gap: SPACING.md },
  summaryPill: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4, borderWidth: 1, ...SHADOW.card },
  summaryValue: { fontFamily: FONT.bold, fontSize: 22, lineHeight: 26 },
  summaryLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  list: { gap: SPACING.md },
  opCard: { gap: SPACING.md },
  opTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  opName: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.textPrimary, lineHeight: 20 },
  opMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  opMachine: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  opOperator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  opOperatorName: { flex: 1, fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textPrimary },
  dueChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.sm, paddingVertical: 4, paddingHorizontal: SPACING.sm },
  dueText: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
  progressSection: { gap: SPACING.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: FONT.medium, fontSize: 12, color: PALETTE.textTertiary },
  progressValue: { fontFamily: FONT.bold, fontSize: 13 },
  progressTrack: { height: 8, backgroundColor: PALETTE.surfaceOverlay, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  opActions: { flexDirection: 'row', gap: 6 },
  opBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 40, borderRadius: RADIUS.md, borderWidth: 1, backgroundColor: 'transparent' },
  opBtnLabel: { fontFamily: FONT.semibold, fontSize: 11 },
  opDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 100 },
  sheetBackdropPress: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: PALETTE.surfaceRaised, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.borderStrong, gap: SPACING.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: PALETTE.borderStrong, alignSelf: 'center', marginBottom: SPACING.sm },
  sheetHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  sheetTitle: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, lineHeight: 23 },
  sheetMeta: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary },
  sheetClose: { width: 36, height: 36, borderRadius: 999, backgroundColor: PALETTE.surfaceOverlay, alignItems: 'center', justifyContent: 'center' },
  sheetChips: { flexDirection: 'row', gap: SPACING.sm },
  sheetOperatorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.lg, padding: SPACING.lg },
  sheetOperatorLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  sheetOperatorName: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary, marginTop: 2 },
  sheetProgress: { gap: SPACING.sm },
  sheetInfoRow: { gap: SPACING.md },
  sheetInfoBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: PALETTE.catYellowSoft, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.catYellowBorder, padding: SPACING.md },
  sheetInfoLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  sheetInfoValue: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary, marginLeft: 'auto' },
});
