import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock, MapPin, Cpu, Play, Square, AlertTriangle, Phone, ChevronRight, TrendingUp, LogOut,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { AlertBanner } from '@/components/AlertBanner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function OperatorHome() {
  const router = useRouter();
  const { managerId, setRole, setManagerId, setToken, setEmail } = useSession();
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftDialog, setShiftDialog] = useState<null | 'start' | 'end'>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const operatorId = managerId || 'operator-01';
        const [profileRes, tasksRes, notifsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/operator/${operatorId}/profile`),
          fetch(`${API_BASE_URL}/api/v1/operator/${operatorId}/tasks`),
          fetch(`${API_BASE_URL}/api/v1/operator/${operatorId}/notifications`),
        ]);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setShiftActive(profileData.shiftStatus === 'on_duty');
        }
        if (tasksRes.ok) {
          const taskData = await tasksRes.json();
          setTasks(taskData || []);
        }
        if (notifsRes.ok) {
          const notificationsData = await notifsRes.json();
          setNotifications(notificationsData || []);
        }
      } catch (e) {
        console.warn('Failed to load operator home data', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [managerId]);

  const handleLogout = () => {
    setRole(null);
    setManagerId(null);
    setToken(null);
    setEmail(null);
    router.replace('/');
  };

  const todayProgress = profile ? Math.min(100, Math.round((tasks.filter((task) => task.status === 'completed').length / Math.max(tasks.length, 1)) * 100)) : 0;
  const workingHours = profile ? `${Math.max(0, Math.round(profile.hoursWorked))}h` : '0h';
  const inProgressTask = tasks.find((task) => task.status === 'in_progress');
  const activeMachineId = inProgressTask?.machineId || tasks?.[0]?.machineId || 'eq-2';

  useEffect(() => {
    if (!activeMachineId) return;
    
    // Convert http/https to ws/wss
    const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/api/v1/ws/telemetry/${activeMachineId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setTelemetry(data);
        
        // Simple client-side alert handling
        if (data.engine_temperature > 100) {
           // We can push this to a local toast or just use standard RN alert if imported, 
           // but we'll just log it for the demo, or we can rely on AlertBanner
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, [inProgressTask?.machineId]);

  return (
    <Screen>
      <OperatorShell active="home">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader
            title={`Welcome, ${profile?.name?.split(' ')[0] || 'Operator'}`}
            subtitle={shiftActive ? 'Shift in progress' : 'Shift not started'}
            onBell={() => {}}
            badge={notifications.filter((item) => !item.read_status).length}
            right={
              <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
                <LogOut size={20} color={PALETTE.error} strokeWidth={2} />
              </Pressable>
            }
          />
          <AlertBanner role="operator" />

          <View style={styles.section}>
            <Pressable style={({ pressed }) => [styles.shiftBanner, shiftActive && styles.shiftBannerActive, pressed && styles.pressed]} onPress={() => setShiftDialog(shiftActive ? 'end' : 'start')}>
              <View style={[styles.shiftIconBox, shiftActive && styles.shiftIconBoxActive]}>
                <Clock size={22} color={shiftActive ? PALETTE.textInverse : PALETTE.catYellow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shiftLabel}>Current Shift</Text>
                <Text style={styles.shiftValue}>{shiftActive ? 'On Duty — Day Shift' : 'Tap to start your shift'}</Text>
              </View>
              <Chip label={shiftActive ? 'LIVE' : 'OFF'} color={shiftActive ? PALETTE.success : PALETTE.textTertiary} soft={shiftActive ? PALETTE.successSoft : 'rgba(255,255,255,0.06)'} dot />
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.statRow}>
              <MiniStat Icon={TrendingUp} label="Today's Progress" value={`${todayProgress}%`} />
              <MiniStat Icon={Clock} label="Working Hours" value={workingHours} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Operator Snapshot" />
            <Card style={styles.equipCard}>
              <View style={{ flex: 1, gap: SPACING.xs }}>
                <Text style={styles.equipName}>{profile?.name || 'Operator'}</Text>
                <Text style={styles.equipMeta}>Employee {profile?.employeeId || '—'}</Text>
                <Text style={styles.equipMeta}>Experience · {profile?.experienceYears ?? 0} years</Text>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: 4 }}>
                  <Chip label={shiftActive ? 'On Duty' : 'Off Duty'} color={shiftActive ? PALETTE.success : PALETTE.textTertiary} soft={shiftActive ? PALETTE.successSoft : 'rgba(255,255,255,0.06)'} dot />
                  <Chip label={`Safety ${profile?.safetyScore ?? 100}`} color={PALETTE.info} soft={PALETTE.infoSoft} />
                </View>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Current Site" />
            <Card style={styles.siteCard}>
              <View style={styles.siteIconBox}>
                <MapPin size={20} color={PALETTE.catYellow} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.siteName}>Main Yard</Text>
                <Text style={styles.siteLoc}>Live task queue is synced from the backend.</Text>
              </View>
              <ChevronRight size={18} color={PALETTE.textTertiary} strokeWidth={2} />
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Active Task" />
            <Card>
              <View style={styles.statusRow}>
                <View style={styles.statusIconBox}>
                  <Cpu size={20} color={PALETTE.success} strokeWidth={2.2} />
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={PALETTE.catYellow} />
                ) : inProgressTask ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusLabel}>{inProgressTask.name}</Text>
                    <Text style={styles.statusMeta}>{inProgressTask.machineName} · {inProgressTask.machineId}</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusLabel}>No active task</Text>
                    <Text style={styles.statusMeta}>Open My Tasks to start one.</Text>
                  </View>
                )}
              </View>
            </Card>
          </View>

          {activeMachineId && (
            <View style={styles.section}>
              <SectionTitle title="System Vitals (Live)" />
              <Card>
                <View style={styles.statRow}>
                  <MiniStat Icon={Cpu} label="Engine RPM" value={telemetry?.engine_rpm?.toString() || '--'} />
                  <MiniStat Icon={AlertTriangle} label="Temp" value={telemetry?.engine_temperature ? `${telemetry.engine_temperature}°C` : '--'} />
                  <MiniStat Icon={TrendingUp} label="Fuel" value={telemetry?.fuel_level_percent ? `${telemetry.fuel_level_percent.toFixed(1)}%` : '--'} />
                </View>
              </Card>
            </View>
          )}

          <View style={styles.section}>
            <SectionTitle title="Quick Actions" />
            <View style={styles.actionsGrid}>
              <QuickAction Icon={Play} label="Start Shift" accent={PALETTE.success} onPress={() => setShiftDialog('start')} disabled={shiftActive} />
              <QuickAction Icon={Square} label="End Shift" accent={PALETTE.error} onPress={() => setShiftDialog('end')} disabled={!shiftActive} />
              <QuickAction Icon={AlertTriangle} label="Report Issue" accent={PALETTE.warning} onPress={() => router.push('/(operator)/tasks')} />
            </View>
          </View>

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

      <ConfirmDialog visible={shiftDialog === 'start'} title="Start Shift" message="This will record the start of your day shift and begin tracking working hours." confirmLabel="Start Shift" onConfirm={() => { setShiftActive(true); setShiftDialog(null); }} onCancel={() => setShiftDialog(null)} />
      <ConfirmDialog visible={shiftDialog === 'end'} title="End Shift" message="This will end your current shift and save today's working hours." confirmLabel="End Shift" danger onConfirm={() => { setShiftActive(false); setShiftDialog(null); }} onCancel={() => setShiftDialog(null)} />
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
  statusMeta: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  qaCard: { width: '48%', flexGrow: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, gap: SPACING.sm, ...SHADOW.card },
  qaDisabled: { opacity: 0.4 },
  qaIcon: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.errorSoft, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.error + '44' },
  emergencyIconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: PALETTE.error + '33', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary },
  emergencySub: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: 2 },
  logoutBtn: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border, alignItems: 'center', justifyContent: 'center' },
});
