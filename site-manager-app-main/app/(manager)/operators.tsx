import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Users, IdCard, Cpu, ListChecks, Briefcase, Shield, CircleDot } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/States';
import { OPERATORS } from '@/data/mock';
import { shiftColor, shiftLabel, healthColor } from '@/theme/status';
import type { ShiftStatus } from '@/types';

const SHIFT_FILTERS: { key: ShiftStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'on_duty', label: 'On Duty' },
  { key: 'break', label: 'On Break' },
  { key: 'off_duty', label: 'Off Duty' },
];

export default function ManagerOperators() {
  const [query, setQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<ShiftStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return OPERATORS.filter((o) => {
      const matchesQuery =
        o.name.toLowerCase().includes(query.toLowerCase()) ||
        o.employeeId.toLowerCase().includes(query.toLowerCase());
      const matchesShift = shiftFilter === 'all' || o.shiftStatus === shiftFilter;
      return matchesQuery && matchesShift;
    });
  }, [query, shiftFilter]);

  return (
    <Screen>
      <ManagerShell active="operators">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
          <View style={styles.stickyHeader}>
            <AppHeader title="Operators" subtitle={`${filtered.length} of ${OPERATORS.length} operators`} onBell={() => {}} />
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search operators, IDs..." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {SHIFT_FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setShiftFilter(f.key)}
                  style={({ pressed }) => [styles.filterChip, shiftFilter === f.key && styles.filterChipActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.filterText, shiftFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {filtered.length === 0 ? (
            <EmptyState Icon={Users} />
          ) : (
            <View style={styles.list}>
              {filtered.map((op) => (
                <Card key={op.id} style={styles.opCard}>
                  <View style={styles.opTop}>
                    <Avatar name={op.name} size={56} showRing={op.shiftStatus === 'on_duty'} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.opName}>{op.name}</Text>
                      <Text style={styles.opEmp}>{op.employeeId}</Text>
                      <View style={styles.opChips}>
                        <Chip label={shiftLabel(op.shiftStatus)} color={shiftColor(op.shiftStatus)} soft={`${shiftColor(op.shiftStatus)}22`} dot />
                        <AvailabilityChip availability={op.availability} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.opInfoRow}>
                    <InfoPill Icon={Cpu} label="Machine" value={op.assignedMachine ?? 'Unassigned'} />
                    <InfoPill Icon={ListChecks} label="Current Task" value={op.currentTask ?? '—'} />
                  </View>

                  <View style={styles.opMetrics}>
                    <Metric Icon={Briefcase} label="Experience" value={`${op.experienceYears}y`} color={PALETTE.info} />
                    <Metric Icon={Shield} label="Safety" value={`${op.safetyScore}`} color={healthColor(op.safetyScore)} />
                    <Metric Icon={ListChecks} label="Tasks" value={`${op.completedTasks}`} color={PALETTE.success} />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </ManagerShell>
    </Screen>
  );
}

function AvailabilityChip({ availability }: { availability: 'available' | 'busy' | 'off' }) {
  const map = {
    available: { label: 'Available', color: PALETTE.success },
    busy: { label: 'Busy', color: PALETTE.warning },
    off: { label: 'Off', color: PALETTE.textTertiary },
  } as const;
  const cfg = map[availability];
  return <Chip label={cfg.label} color={cfg.color} soft={`${cfg.color}22`} dot />;
}

function InfoPill({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <View style={styles.infoPillIcon}>
        <Icon size={13} color={PALETTE.textSecondary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoPillLabel}>{label}</Text>
        <Text style={styles.infoPillValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ Icon, label, value, color }: { Icon: any; label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: color + '22' }]}>
        <Icon size={14} color={color} strokeWidth={2.2} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  stickyHeader: { backgroundColor: PALETTE.bg, paddingBottom: SPACING.md, gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  filterRow: { gap: SPACING.sm, paddingHorizontal: SPACING.xs },
  filterChip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.pill, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border },
  filterChipActive: { backgroundColor: PALETTE.catYellowSoft, borderColor: PALETTE.catYellowBorder },
  filterText: { fontFamily: FONT.medium, fontSize: 12, color: PALETTE.textSecondary },
  filterTextActive: { color: PALETTE.catYellow },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  opCard: { gap: SPACING.md },
  opTop: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'flex-start' },
  opName: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary, lineHeight: 21 },
  opEmp: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  opChips: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4, flexWrap: 'wrap' },
  opInfoRow: { flexDirection: 'row', gap: SPACING.md },
  infoPill: { flex: 1, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.md, padding: SPACING.sm },
  infoPillIcon: { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' },
  infoPillLabel: { fontFamily: FONT.regular, fontSize: 10, color: PALETTE.textTertiary },
  infoPillValue: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textPrimary, lineHeight: 16 },
  opMetrics: { flexDirection: 'row', gap: SPACING.md },
  metric: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.md, paddingVertical: SPACING.md },
  metricIcon: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.textPrimary },
  metricLabel: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
});
