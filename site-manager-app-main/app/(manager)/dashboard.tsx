import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Boxes, KeyRound, Cog, Moon, Users, Activity, Wrench, ShieldAlert,
  PackagePlus, FileText, CheckCircle2, AlertTriangle, CalendarClock,
  ChevronRight,
} from 'lucide-react-native';
import { ComponentType } from 'react';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { CURRENT_MANAGER, DASHBOARD_STATS, ACTIVITIES } from '@/data/mock';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type SummaryCard = {
  Icon: IconType;
  label: string;
  value: number;
  accent: string;
};

const SUMMARY: SummaryCard[] = [
  { Icon: Boxes, label: 'Total Assets', value: DASHBOARD_STATS.totalAssets, accent: PALETTE.catYellow },
  { Icon: KeyRound, label: 'Active Rentals', value: DASHBOARD_STATS.activeRentals, accent: PALETTE.success },
  { Icon: Cog, label: 'Machines Working', value: DASHBOARD_STATS.machinesWorking, accent: PALETTE.info },
  { Icon: Moon, label: 'Machines Idle', value: DASHBOARD_STATS.machinesIdle, accent: PALETTE.warning },
  { Icon: Users, label: 'Operators On Duty', value: DASHBOARD_STATS.operatorsOnDuty, accent: PALETTE.catYellow },
  { Icon: Activity, label: 'Running Operations', value: DASHBOARD_STATS.runningOperations, accent: PALETTE.info },
  { Icon: Wrench, label: 'Maintenance Due', value: DASHBOARD_STATS.maintenanceDue, accent: PALETTE.warning },
  { Icon: ShieldAlert, label: 'Safety Alerts', value: DASHBOARD_STATS.safetyAlerts, accent: PALETTE.error },
];

const ACTIVITY_ICONS: Record<string, { Icon: IconType; accent: string }> = {
  assigned: { Icon: PackagePlus, accent: PALETTE.info },
  rental_started: { Icon: KeyRound, accent: PALETTE.success },
  task_completed: { Icon: CheckCircle2, accent: PALETTE.success },
  issue_reported: { Icon: AlertTriangle, accent: PALETTE.warning },
  maintenance_scheduled: { Icon: CalendarClock, accent: PALETTE.warning },
};

export default function ManagerDashboard() {
  const router = useRouter();

  return (
    <Screen>
      <ManagerShell active="dashboard">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title={`Welcome, ${CURRENT_MANAGER.name.split(' ')[0]}`}
            subtitle={`${CURRENT_MANAGER.siteName} · Site Manager`}
            onSearch={() => router.push('/(manager)/assets')}
            onBell={() => {}}
            badge={DASHBOARD_STATS.safetyAlerts}
          />

          {/* Hero KPIs - first row */}
          <View style={styles.section}>
            <View style={styles.kpiRow}>
              <KpiCard Icon={Boxes} label="Total Assets" value={DASHBOARD_STATS.totalAssets} accent={PALETTE.catYellow} big />
              <KpiCard Icon={Activity} label="Operations" value={DASHBOARD_STATS.runningOperations} accent={PALETTE.info} big />
            </View>
          </View>

          {/* Summary grid */}
          <View style={styles.section}>
            <SectionLabel title="Executive Summary" />
            <View style={styles.grid}>
              {SUMMARY.slice(2).map((s) => (
                <SummaryTile key={s.label} {...s} />
              ))}
            </View>
          </View>

          {/* Safety + maintenance highlight */}
          <View style={styles.section}>
            <View style={styles.kpiRow}>
              <HighlightCard
                Icon={ShieldAlert}
                label="Safety Alerts"
                value={DASHBOARD_STATS.safetyAlerts}
                detail="Requires immediate attention"
                accent={PALETTE.error}
                onPress={() => router.push('/(manager)/operations')}
              />
              <HighlightCard
                Icon={Wrench}
                label="Maintenance Due"
                value={DASHBOARD_STATS.maintenanceDue}
                detail="Scheduled this week"
                accent={PALETTE.warning}
                onPress={() => router.push('/(manager)/assets')}
              />
            </View>
          </View>

          {/* Activity timeline */}
          <View style={[styles.section, { marginBottom: SPACING.xxxl }]}>
            <SectionLabel title="Recent Activity" />
            <Card style={styles.timelineCard}>
              {ACTIVITIES.map((a, i) => {
                const cfg = ACTIVITY_ICONS[a.type];
                const isLast = i === ACTIVITIES.length - 1;
                return (
                  <View key={a.id} style={[styles.timelineItem, !isLast && styles.timelineItemBorder]}>
                    <View style={[styles.timelineIcon, { backgroundColor: cfg.accent + '22', borderColor: cfg.accent + '44' }]}>
                      <cfg.Icon size={16} color={cfg.accent} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineTitle}>{a.title}</Text>
                      <Text style={styles.timelineDetail} numberOfLines={1}>{a.detail}</Text>
                    </View>
                    <Text style={styles.timelineTime}>{a.timestamp}</Text>
                  </View>
                );
              })}
            </Card>
          </View>
        </ScrollView>
      </ManagerShell>
    </Screen>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function KpiCard({ Icon, label, value, accent, big }: { Icon: IconType; label: string; value: number; accent: string; big?: boolean }) {
  return (
    <View style={[styles.kpiCard, SHADOW.raised, { borderColor: accent + '33' }]}>
      <View style={[styles.kpiIcon, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <Icon size={big ? 24 : 20} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={[styles.kpiValue, big && styles.kpiValueBig]}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function SummaryTile({ Icon, label, value, accent }: SummaryCard) {
  return (
    <View style={[styles.summaryTile, SHADOW.card]}>
      <View style={[styles.summaryIcon, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
        <Icon size={17} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function HighlightCard({ Icon, label, value, detail, accent, onPress }: { Icon: IconType; label: string; value: number; detail: string; accent: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.highlightCard, { borderColor: accent + '44' }, pressed && styles.pressed]}>
      <View style={styles.highlightTop}>
        <View style={[styles.highlightIcon, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
          <Icon size={18} color={accent} strokeWidth={2.2} />
        </View>
        <Text style={[styles.highlightValue, { color: accent }]}>{value}</Text>
      </View>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightDetail}>{detail}</Text>
      <View style={styles.highlightArrow}>
        <ChevronRight size={14} color={accent} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  section: { gap: SPACING.md },
  sectionLabel: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  kpiRow: { flexDirection: 'row', gap: SPACING.md },
  kpiCard: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, gap: SPACING.sm, borderWidth: 1, borderColor: PALETTE.border },
  kpiIcon: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontFamily: FONT.bold, fontSize: 28, color: PALETTE.textPrimary, lineHeight: 32 },
  kpiValueBig: { fontSize: 34, lineHeight: 38 },
  kpiLabel: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  summaryTile: { width: '31.5%', flexGrow: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, minHeight: 96 },
  summaryIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontFamily: FONT.bold, fontSize: 22, color: PALETTE.textPrimary, lineHeight: 26 },
  summaryLabel: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary, lineHeight: 15 },
  highlightCard: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 4, borderWidth: 1, ...SHADOW.card, position: 'relative' },
  highlightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  highlightIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  highlightValue: { fontFamily: FONT.bold, fontSize: 26, lineHeight: 30 },
  highlightLabel: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textPrimary },
  highlightDetail: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textTertiary },
  highlightArrow: { position: 'absolute', top: SPACING.md, right: SPACING.md },
  timelineCard: { gap: 0, padding: SPACING.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  timelineItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PALETTE.border },
  timelineIcon: { width: 36, height: 36, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timelineTitle: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary },
  timelineDetail: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, marginTop: 2 },
  timelineTime: { fontFamily: FONT.medium, fontSize: 11, color: PALETTE.textTertiary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
