import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award, CheckCircle2, Clock, Shield, TrendingUp, LogOut, IdCard, Briefcase,
  ChevronRight,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ProgressBar } from '@/components/ProgressBar';
import { shiftColor, shiftLabel, healthColor } from '@/theme/status';
import { useSession } from '@/context/SessionContext';
import { useApi } from '@/services/api';

export default function OperatorProfile() {
  const router = useRouter();
  const { setRole, setToken, setUserId, userId } = useSession();
  const { fetchWithAuth } = useApi();
  const [logout, setLogout] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWithAuth(`/api/v1/operator/${userId}/profile`)
        .then(data => setProfile(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleLogout = () => {
    setLogout(false);
    setRole(null);
    setToken(null);
    setUserId(null);
    router.replace('/');
  };

  if (loading) {
    return (
      <Screen>
        <OperatorShell active="profile">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={PALETTE.catYellow} />
          </View>
        </OperatorShell>
      </Screen>
    );
  }


  return (
    <Screen>
      <OperatorShell active="profile">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Profile" />

          {/* Profile header */}
          <Card style={styles.profileCard}>
            <View style={styles.profileTop}>
              <Avatar name={profile?.name ?? 'Operator'} size={72} showRing />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profile?.name ?? '—'}</Text>
                <Text style={styles.role}>Heavy Equipment Operator</Text>
                <View style={{ marginTop: SPACING.sm }}>
                  <Chip label={shiftLabel(profile?.shiftStatus ?? 'off_duty')} color={shiftColor(profile?.shiftStatus ?? 'off_duty')} soft={`${shiftColor(profile?.shiftStatus ?? 'off_duty')}22`} dot size="md" />
                </View>
              </View>
            </View>
          </Card>

          {/* Identity */}
          <View style={styles.section}>
            <SectionLabel>Identity</SectionLabel>
            <Card style={styles.idCard}>
              <IdRow Icon={IdCard} label="Employee ID" value={profile?.employeeId?.slice(-8).toUpperCase() ?? '—'} />
              <View style={styles.divider} />
              <IdRow Icon={Briefcase} label="Experience" value={`${profile?.experienceYears ?? 0} years`} />
              <View style={styles.divider} />
              <IdRow Icon={Shield} label="Current Machine" value={profile?.assignedMachine ?? '—'} />
            </Card>
          </View>

          {/* Performance stats */}
          <View style={styles.section}>
            <SectionLabel>Performance</SectionLabel>
            <View style={styles.statGrid}>
              <PerfStat Icon={CheckCircle2} label="Completed Tasks" value={`${profile?.completedTasks ?? 0}`} accent={PALETTE.success} />
              <PerfStat Icon={Clock} label="Hours Worked" value={`${profile?.hoursWorked ?? 0}h`} accent={PALETTE.info} />
            </View>
            <Card style={styles.safetyCard}>
              <View style={styles.safetyTop}>
                <View style={styles.safetyIconBox}>
                  <Shield size={20} color={healthColor(profile?.safetyScore ?? 100)} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safetyLabel}>Safety Score</Text>
                  <Text style={styles.safetyValue}>{profile?.safetyScore ?? 100} / 100</Text>
                </View>
                <Chip label="Excellent" color={healthColor(profile?.safetyScore ?? 100)} soft={`${healthColor(profile?.safetyScore ?? 100)}22`} dot />
              </View>
              <ProgressBar value={profile?.safetyScore ?? 100} color={healthColor(profile?.safetyScore ?? 100)} height={10} />
            </Card>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <SectionLabel>Achievements</SectionLabel>
            <View style={styles.achievementList}>
              {(profile?.achievements ?? ['Safety Champion']).map((a: string) => (
                <Card key={a} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Award size={18} color={PALETTE.catYellow} strokeWidth={2} />
                  </View>
                  <Text style={styles.achievementText}>{a}</Text>
                </Card>
              ))}
            </View>
          </View>

          {/* Logout */}
          <View style={[styles.section, { marginBottom: SPACING.xxxl }]}>
            <Pressable onPress={() => setLogout(true)} style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
              <LogOut size={20} color={PALETTE.error} strokeWidth={2.2} />
              <Text style={styles.logoutText}>Logout</Text>
              <ChevronRight size={18} color={PALETTE.error} strokeWidth={2} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </View>
        </ScrollView>
      </OperatorShell>

      <ConfirmDialog
        visible={logout}
        title="Logout"
        message="You'll return to the role selection screen. Your shift data is saved."
        confirmLabel="Logout"
        danger
        onConfirm={handleLogout}
        onCancel={() => setLogout(false)}
      />
    </Screen>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function IdRow({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={styles.idRow}>
      <View style={styles.idIconBox}>
        <Icon size={17} color={PALETTE.catYellow} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.idLabel}>{label}</Text>
        <Text style={styles.idValue}>{value}</Text>
      </View>
    </View>
  );
}

function PerfStat({ Icon, label, value, accent }: { Icon: any; label: string; value: string; accent: string }) {
  return (
    <View style={styles.perfStat}>
      <View style={[styles.perfIcon, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.perfValue}>{value}</Text>
      <Text style={styles.perfLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  section: { gap: SPACING.md },
  sectionLabel: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  profileCard: { alignItems: 'flex-start' },
  profileTop: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'center' },
  name: { fontFamily: FONT.bold, fontSize: 22, color: PALETTE.textPrimary, lineHeight: 27 },
  role: { fontFamily: FONT.regular, fontSize: 14, color: PALETTE.textSecondary, marginTop: 2 },
  idCard: { gap: 0, padding: 0, overflow: 'hidden' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  idIconBox: { width: 38, height: 38, borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, alignItems: 'center', justifyContent: 'center' },
  idLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  idValue: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.textPrimary, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: PALETTE.border, marginLeft: 64 },
  statGrid: { flexDirection: 'row', gap: SPACING.md },
  perfStat: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, ...SHADOW.card },
  perfIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perfValue: { fontFamily: FONT.bold, fontSize: 20, color: PALETTE.textPrimary, lineHeight: 24 },
  perfLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },
  safetyCard: { gap: SPACING.md },
  safetyTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  safetyIconBox: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: PALETTE.successSoft, alignItems: 'center', justifyContent: 'center' },
  safetyLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  safetyValue: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, marginTop: 2 },
  achievementList: { gap: SPACING.sm },
  achievementCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md + 2 },
  achievementIcon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: PALETTE.catYellowSoft, borderWidth: 1, borderColor: PALETTE.catYellowBorder, alignItems: 'center', justifyContent: 'center' },
  achievementText: { flex: 1, fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.errorSoft, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.error + '44' },
  logoutText: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.error },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
