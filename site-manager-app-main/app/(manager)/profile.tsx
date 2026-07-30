import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2, Boxes, Users, FileText, Settings, LogOut, ChevronRight,
  MapPin, IdCard,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CURRENT_MANAGER } from '@/data/mock';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function ManagerProfile() {
  const router = useRouter();
  const { setRole, managerId } = useSession();
  const [logout, setLogout] = useState(false);
  const [profileData, setProfileData] = useState({
    name: CURRENT_MANAGER.name,
    siteName: CURRENT_MANAGER.siteName,
    managedAssets: CURRENT_MANAGER.managedAssets,
    operators: CURRENT_MANAGER.operators,
    reportsGenerated: CURRENT_MANAGER.reportsGenerated
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const resolvedManagerId = managerId || 'mgr-01';
        const response = await fetch(`${API_BASE_URL}/api/v1/manager/profile/${resolvedManagerId}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData({
            name: data.name,
            siteName: data.site_name,
            managedAssets: data.managed_assets,
            operators: data.operators,
            reportsGenerated: data.reports_generated
          });
        }
      } catch (err) {
        console.warn('Failed to load profile from backend, using mock:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [managerId]);

  const handleLogout = () => {
    setLogout(false);
    setRole(null);
    router.replace('/');
  };

  return (
    <Screen>
      <ManagerShell active="profile">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Profile" />

          {/* Profile header */}
          <Card style={styles.profileCard}>
            <View style={styles.profileTop}>
              <Avatar name={profileData.name} size={72} showRing />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profileData.name}</Text>
                <Text style={styles.role}>Site Manager</Text>
                <View style={{ marginTop: SPACING.sm }}>
                  <Chip label="On Duty" color={PALETTE.success} soft={PALETTE.successSoft} dot size="md" />
                </View>
              </View>
            </View>
          </Card>

          {/* Site info */}
          <View style={styles.section}>
            <SectionLabel>Site Information</SectionLabel>
            <Card style={styles.idCard}>
              <IdRow Icon={IdCard} label="Manager ID" value={managerId || "MGR-9901"} />
              <View style={styles.divider} />
              <IdRow Icon={MapPin} label="Site Name" value={profileData.siteName} />
              <View style={styles.divider} />
              <IdRow Icon={Building2} label="Facility" value="Caterpillar Authorized Dealer" />
            </Card>
          </View>

          {/* Management stats */}
          <View style={styles.section}>
            <SectionLabel>Management Overview</SectionLabel>
            <View style={styles.statGrid}>
              <StatTile Icon={Boxes} label="Managed Assets" value={`${profileData.managedAssets}`} accent={PALETTE.catYellow} />
              <StatTile Icon={Users} label="Operators" value={`${profileData.operators}`} accent={PALETTE.info} />
              <StatTile Icon={FileText} label="Reports Generated" value={`${profileData.reportsGenerated}`} accent={PALETTE.success} />
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <SectionLabel>Settings</SectionLabel>
            <Card style={styles.idCard}>
              <SettingsRow Icon={Settings} label="Notifications" value="Enabled" />
              <View style={styles.divider} />
              <SettingsRow Icon={FileText} label="Report Frequency" value="Weekly" />
              <View style={styles.divider} />
              <SettingsRow Icon={Building2} label="Site Preferences" value="Highland Quarry" />
            </Card>
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
      </ManagerShell>

      <ConfirmDialog
        visible={logout}
        title="Logout"
        message="You'll return to the role selection screen."
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

function SettingsRow({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <Pressable style={({ pressed }) => [styles.idRow, pressed && styles.pressed]}>
      <View style={styles.idIconBox}>
        <Icon size={17} color={PALETTE.catYellow} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.idLabel}>{label}</Text>
        <Text style={styles.idValue}>{value}</Text>
      </View>
      <ChevronRight size={18} color={PALETTE.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

function StatTile({ Icon, label, value, accent }: { Icon: any; label: string; value: string; accent: string }) {
  return (
    <View style={[styles.statTile, SHADOW.card]}>
      <View style={[styles.statIcon, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
        <Icon size={18} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
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
  statTile: { flex: 1, backgroundColor: PALETTE.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, minHeight: 100 },
  statIcon: { width: 38, height: 38, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: FONT.bold, fontSize: 22, color: PALETTE.textPrimary, lineHeight: 26 },
  statLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, lineHeight: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.errorSoft, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.error + '44' },
  logoutText: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.error },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
