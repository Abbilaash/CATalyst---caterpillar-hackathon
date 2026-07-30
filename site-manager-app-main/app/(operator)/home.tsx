import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock, MapPin, Cpu, Activity, Play, Square, AlertTriangle, Phone,
  QrCode, ChevronRight, TrendingUp, HardHat,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ProgressBar } from '@/components/ProgressBar';
import { EquipmentImage } from '@/components/EquipmentImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  CURRENT_OPERATOR, CURRENT_ASSET, CURRENT_SITE, CURRENT_TASKS, DASHBOARD_STATS,
} from '@/data/mock';
import { shiftColor, shiftLabel, statusColor, statusLabel } from '@/theme/status';
import { useSession } from '@/context/SessionContext';

export default function OperatorHome() {
  const router = useRouter();
  const { setRole } = useSession();
  const [shiftActive, setShiftActive] = useState(CURRENT_OPERATOR.shiftStatus === 'on_duty');
  const [shiftDialog, setShiftDialog] = useState<null | 'start' | 'end'>(null);

  const todayProgress = 58;
  const workingHours = '6h 24m';
  const inProgressTask = CURRENT_TASKS.find((t) => t.status === 'in_progress');

  return (
    <Screen>
      <OperatorShell active="home">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title={`Welcome, ${CURRENT_OPERATOR.name.split(' ')[0]}`}
            subtitle={shiftActive ? 'Shift in progress' : 'Shift not started'}
            onBell={() => {}}
            badge={2}
          />

          {/* Shift status banner */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [styles.shiftBanner, shiftActive && styles.shiftBannerActive, pressed && styles.pressed]}
              onPress={() => setShiftDialog(shiftActive ? 'end' : 'start')}
            >
              <View style={[styles.shiftIconBox, shiftActive && styles.shiftIconBoxActive]}>
                <Clock size={22} color={shiftActive ? PALETTE.textInverse : PALETTE.catYellow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftLabel}>Current Shift</Text>
                <Text style={styles.shiftValue}>{shiftActive ? 'On Duty — Day Shift' : 'Tap to start your shift'}</Text>
              </View>
              <Chip
                label={shiftActive ? 'LIVE' : 'OFF'}
                color={shiftActive ? PALETTE.success : PALETTE.textTertiary}
                soft={shiftActive ? PALETTE.successSoft : 'rgba(255,255,255,0.06)'}
                dot
              />
            </Pressable>
          </View>

          {/* Quick stats */}
          <View style={styles.section}>
            <View style={styles.statRow}>
              <MiniStat Icon={TrendingUp} label="Today's Progress" value={`${todayProgress}%`} />
              <MiniStat Icon={Clock} label="Working Hours" value={workingHours} />
            </View>
          </View>

          {/* Assigned equipment */}
          {CURRENT_ASSET && (
            <View style={styles.section}>
              <SectionTitle title="Assigned Equipment" />
              <Card style={styles.equipCard}>
                <EquipmentImage seed={CURRENT_ASSET.imageSeed} size={88} rounded={14} />
                <View style={{ flex: 1, gap: SPACING.xs }}>
                  <Text style={styles.equipName}>{CURRENT_ASSET.name}</Text>
                  <Text style={styles.equipMeta}>Machine ID · {CURRENT_ASSET.machineId}</Text>
                  <Text style={styles.equipMeta}>Rental · {CURRENT_ASSET.rentalId}</Text>
                  <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: 4 }}>
                    <Chip label={statusLabel(CURRENT_ASSET.status)} color={statusColor(CURRENT_ASSET.status)} soft={`${statusColor(CURRENT_ASSET.status)}22`} dot />
                    <Chip label={`Health ${CURRENT_ASSET.healthScore}%`} color={PALETTE.info} soft={PALETTE.infoSoft} />
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Current site */}
          {CURRENT_SITE && (
            <View style={styles.section}>
              <SectionTitle title="Current Site" />
              <Card style={styles.siteCard}>
                <View style={styles.siteIconBox}>
                  <MapPin size={20} color={PALETTE.catYellow} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.siteName}>{CURRENT_SITE.name}</Text>
                  <Text style={styles.siteLoc}>{CURRENT_SITE.location}</Text>
                </View>
                <ChevronRight size={18} color={PALETTE.textTertiary} strokeWidth={2} />
              </Card>
            </View>
          )}

          {/* Machine status + in-progress task */}
          <View style={styles.section}>
            <SectionTitle title="Machine Status" />
            <Card>
              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <Cpu size={20} color={PALETTE.success} strokeWidth={2.2} />
                </View>
                <Text style={styles.statusLabel}>Operational</Text>
                <Chip label="All systems nominal" color={PALETTE.success} soft={PALETTE.successSoft} dot />
              </View>
              {inProgressTask && (
                <View style={styles.taskInline}>
                  <Text style={styles.taskInlineTitle} numberOfLines={1}>{inProgressTask.name}</Text>
                  <ProgressBar value={inProgressTask.progress} showLabel />
                </View>
              )}
            </Card>
          </View>

          {/* Quick actions */}
          <View style={styles.section}>
            <SectionTitle title="Quick Actions" />
            <View style={styles.actionsGrid}>
              <QuickAction
                Icon={Play}
                label="Start Shift"
                accent={PALETTE.success}
                onPress={() => setShiftDialog('start')}
                disabled={shiftActive}
              />
              <QuickAction
                Icon={Square}
                label="End Shift"
                accent={PALETTE.error}
                onPress={() => setShiftDialog('end')}
                disabled={!shiftActive}
              />
              <QuickAction
                Icon={QrCode}
                label="Scan QR"
                accent={PALETTE.catYellow}
                onPress={() => router.push('/(operator)/scan')}
              />
              <QuickAction
                Icon={AlertTriangle}
                label="Report Issue"
                accent={PALETTE.warning}
                onPress={() => router.push('/(operator)/scan')}
              />
            </View>
          </View>

          {/* Emergency contact */}
          <View style={[styles.section, { marginBottom: SPACING.xxl }]}>
            <Pressable style={({ pressed }) => [styles.emergencyCard, pressed && styles.pressed]}>
              <View style={styles.emergencyIconBox}>
                <Phone size={20} color={PALETTE.error} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyTitle}>Emergency Contact</Text>
                <Text style={styles.emergencySub}>Site Safety · +1 (480) 555-0142</Text>
              </View>
              <Chip label="24/7" color={PALETTE.error} soft={PALETTE.errorSoft} dot />
            </Pressable>
          </View>
        </ScrollView>
      </OperatorShell>

      <ConfirmDialog
        visible={shiftDialog === 'start'}
        title="Start Shift"
        message="This will record the start of your day shift and begin tracking working hours."
        confirmLabel="Start Shift"
        onConfirm={() => { setShiftActive(true); setShiftDialog(null); }}
        onCancel={() => setShiftDialog(null)}
      />
      <ConfirmDialog
        visible={shiftDialog === 'end'}
        title="End Shift"
        message="This will end your current shift and save today's working hours."
        confirmLabel="End Shift"
        danger
        onConfirm={() => { setShiftActive(false); setShiftDialog(null); }}
        onCancel={() => setShiftDialog(null)}
      />
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function MiniStat({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <View style={styles.miniStatIcon}>
        <Icon size={16} color={PALETTE.catYellow} strokeWidth={2.2} />
      </View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ Icon, label, accent, onPress, disabled }: { Icon: any; label: string; accent: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.qaCard, disabled && styles.qaDisabled, pressed && styles.pressed]}>
      <View style={[styles.qaIcon, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
        <Icon size={22} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  section: { gap: SPACING.md },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sectionTitle: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  shiftBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.border,
    ...SHADOW.card,
  },
  shiftBannerActive: { borderColor: PALETTE.catYellowBorder, backgroundColor: PALETTE.surfaceRaised },
  shiftIconBox: { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: PALETTE.catYellowSoft, borderWidth: 1, borderColor: PALETTE.catYellowBorder, alignItems: 'center', justifyContent: 'center' },
  shiftIconBoxActive: { backgroundColor: PALETTE.success, borderColor: PALETTE.success },
  shiftLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  shiftValue: { fontFamily: FONT.semibold, fontSize: 16, color: PALETTE.textPrimary, lineHeight: 21, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: SPACING.md },
  miniStat: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, gap: 6, ...SHADOW.card },
  miniStatIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, alignItems: 'center', justifyContent: 'center' },
  miniStatValue: { fontFamily: FONT.bold, fontSize: 20, color: PALETTE.textPrimary, lineHeight: 24 },
  miniStatLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  equipCard: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'flex-start' },
  equipName: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary, lineHeight: 21 },
  equipMeta: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, lineHeight: 18 },
  siteCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  siteIconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: PALETTE.catYellowSoft, borderWidth: 1, borderColor: PALETTE.catYellowBorder, alignItems: 'center', justifyContent: 'center' },
  siteName: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary },
  siteLoc: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  statusIconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: PALETTE.successSoft, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { flex: 1, fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary },
  taskInline: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PALETTE.border, gap: SPACING.sm },
  taskInlineTitle: { fontFamily: FONT.medium, fontSize: 14, color: PALETTE.textPrimary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  qaCard: { width: '48%', flexGrow: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, gap: SPACING.sm, ...SHADOW.card },
  qaDisabled: { opacity: 0.4 },
  qaIcon: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.errorSoft, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.error + '44' },
  emergencyIconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: PALETTE.error + '33', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary },
  emergencySub: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: 2 },
});
