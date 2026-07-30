import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2, LogOut, ChevronRight, MapPin, IdCard, Save,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function ManagerProfile() {
  const router = useRouter();
  const { setRole, managerId } = useSession();
  const [logout, setLogout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'site_manager',
    status: 'active',
    password: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/manager`);
        if (response.ok) {
          const data = await response.json();
          setProfileForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'site_manager',
            status: data.status || 'active',
            password: '',
          });
        }
      } catch (err) {
        console.warn('Failed to load profile from backend:', err);
        setMessage('Unable to load profile data.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleLogout = () => {
    setLogout(false);
    setRole(null);
    router.replace('/');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, string> = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        role: profileForm.role,
        status: profileForm.status,
      };
      if (profileForm.password) payload.password = profileForm.password;
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/manager`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Unable to save profile');
      const data = await response.json();
      setProfileForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'site_manager',
        status: data.status || 'active',
        password: '',
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      console.warn('Failed to save profile:', err);
      setMessage('Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ManagerShell active="profile">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Profile" />

          <Card style={styles.profileCard}>
            <View style={styles.profileTop}>
              <Avatar name={profileForm.name || 'Site Manager'} size={72} showRing />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{profileForm.name || 'Site Manager'}</Text>
                <Text style={styles.role}>Site Manager</Text>
              </View>
            </View>
          </Card>

          <View style={styles.section}>
            <SectionLabel>Profile Details</SectionLabel>
            <Card style={styles.idCard}>
              {loading ? (
                <View style={styles.loadingRow}><ActivityIndicator color={PALETTE.catYellow} /></View>
              ) : (
                <>
                  <FieldRow label="Name" value={profileForm.name} onChangeText={(value) => setProfileForm((current) => ({ ...current, name: value }))} />
                  <View style={styles.divider} />
                  <FieldRow label="Email" value={profileForm.email} onChangeText={(value) => setProfileForm((current) => ({ ...current, email: value }))} keyboardType="email-address" />
                  <View style={styles.divider} />
                  <FieldRow label="Phone" value={profileForm.phone} onChangeText={(value) => setProfileForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" />
                  <View style={styles.divider} />
                  <FieldRow label="Role" value={profileForm.role} onChangeText={(value) => setProfileForm((current) => ({ ...current, role: value }))} />
                  <View style={styles.divider} />
                  <FieldRow label="Status" value={profileForm.status} onChangeText={(value) => setProfileForm((current) => ({ ...current, status: value }))} />
                  <View style={styles.divider} />
                  <FieldRow label="New Password" value={profileForm.password} onChangeText={(value) => setProfileForm((current) => ({ ...current, password: value }))} secureTextEntry placeholder="Leave blank to keep current" />
                </>
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionLabel>Account Information</SectionLabel>
            <Card style={styles.idCard}>
              <IdRow Icon={IdCard} label="Manager ID" value={managerId || 'MGR-9901'} />
              <View style={styles.divider} />
              <IdRow Icon={MapPin} label="Site Name" value="Caterpillar Authorized Dealer" />
              <View style={styles.divider} />
              <IdRow Icon={Building2} label="Facility" value="Site Manager Workspace" />
            </Card>
          </View>

          <View style={styles.section}>
            <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]} disabled={saving}>
              <Save size={18} color={PALETTE.surface} strokeWidth={2.2} />
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </Pressable>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

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

function FieldRow({ label, value, onChangeText, keyboardType, secureTextEntry, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'email-address' | 'phone-pad'; secureTextEntry?: boolean; placeholder?: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.idLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={PALETTE.textTertiary}
        style={styles.input}
      />
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
  fieldRow: { padding: SPACING.lg, gap: 6 },
  input: { borderWidth: 1, borderColor: PALETTE.border, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: PALETTE.textPrimary, backgroundColor: PALETTE.surface },
  loadingRow: { padding: SPACING.lg, alignItems: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: PALETTE.catYellow, borderRadius: RADIUS.lg, padding: SPACING.lg },
  saveText: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.surface },
  message: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: SPACING.sm },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.errorSoft, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: PALETTE.error + '44' },
  logoutText: { fontFamily: FONT.semibold, fontSize: 15, color: PALETTE.error },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
