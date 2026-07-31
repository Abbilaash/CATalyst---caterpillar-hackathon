import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
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

import { AlertBanner } from '@/components/AlertBanner';
import { EquipmentImage } from '@/components/EquipmentImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';

import { shiftColor, shiftLabel, statusColor, statusLabel } from '@/theme/status';
import { useSession } from '@/context/SessionContext';
import { useApi } from '@/services/api';

export default function OperatorHome() {
  const router = useRouter();
  const { setRole, userId } = useSession();
  const { fetchWithAuth } = useApi();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftDialog, setShiftDialog] = useState<null | 'start' | 'end'>(null);

  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetchWithAuth(`/api/v1/operator/${userId}/profile`),
        fetchWithAuth(`/api/v1/operator/${userId}/tasks`)
      ])
        .then(([profileData, tasksData]) => {
          setProfile(profileData);
          setShiftActive(profileData.shiftStatus === 'on_duty');
          setTasks(tasksData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  const toggleShift = async () => {
    try {
      const data = await fetchWithAuth(`/api/v1/operator/${userId}/shift/toggle`, { method: 'POST' });
      setShiftActive(data.shiftStatus === 'on_duty');
    } catch (e) {
      console.error(e);
      alert("Failed to update shift status");
    } finally {
      setShiftDialog(null);
    }
  };

  const todayProgress = tasks.length > 0 ? Math.min(100, Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)) : 0;
  const workingHours = profile?.hoursWorked ? `${Math.floor(profile.hoursWorked)}h ${Math.round((profile.hoursWorked % 1) * 60)}m` : '0h 0m';
  const inProgressTask = tasks.find((t) => t.status === 'in_progress' || t.status === 'active');

  if (loading) {
    return (
      <Screen>
        <OperatorShell active="home">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={PALETTE.catYellow} />
          </View>
        </OperatorShell>
      </Screen>
    );
  }

  return (
    <Screen>
      <OperatorShell active="home">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title={`Welcome, ${profile?.name?.split(' ')[0] ?? 'Operator'}`}
            subtitle={shiftActive ? 'Shift in progress' : 'Shift not started'}
            onBell={() => {}}
            badge={2}
          />
          <AlertBanner role="operator" />

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
          {inProgressTask && (
            <View style={styles.section}>
              <SectionTitle title="Assigned Equipment" />
              <Card style={styles.equipCard}>
                <EquipmentImage seed={inProgressTask.imageSeed || inProgressTask.machineName || 'equip'} size={88} rounded={14} />
                <View style={{ flex: 1, gap: SPACING.xs }}>
                  <Text style={styles.equipName}>{inProgressTask.machineName}</Text>
                  <Text style={styles.equipMeta}>Machine ID · {inProgressTask.machineId}</Text>
                  {inProgressTask.rentalId && <Text style={styles.equipMeta}>Rental · {inProgressTask.rentalId}</Text>}
                  <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: 4 }}>
                    <Chip label="Rented" color={statusColor('rented')} soft={`${statusColor('rented')}22`} dot />
                    <Chip label={`Health ${inProgressTask.healthScore ?? 100}%`} color={PALETTE.info} soft={PALETTE.infoSoft} />
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Current site */}
          {inProgressTask && inProgressTask.siteName && (
            <View style={styles.section}>
              <SectionTitle title="Current Site" />
              <Card style={styles.siteCard}>
                <View style={styles.siteIconBox}>
                  <MapPin size={20} color={PALETTE.catYellow} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.siteName}>{inProgressTask.siteName}</Text>
                  <Text style={styles.siteLoc}>Active Worksite</Text>
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
        onConfirm={toggleShift}
        onCancel={() => setShiftDialog(null)}
      />
      <ConfirmDialog
        visible={shiftDialog === 'end'}
        title="End Shift"
        message="This will end your current shift and save today's working hours."
        confirmLabel="End Shift"
        danger
        onConfirm={toggleShift}
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
