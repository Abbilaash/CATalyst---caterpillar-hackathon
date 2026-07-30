import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HardHat, Building2, Lock, User, ArrowLeft, ChevronRight, ShieldCheck,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { useSession } from '@/context/SessionContext';
import { usePushToken } from '@/hooks/usePushToken';
import { API_BASE } from '@/services/api';
import type { Role } from '@/types';

type RoleConfig = {
  role: Role;
  route: '/operator-login' | '/manager-login';
  icon: typeof HardHat;
  welcomeTitle: string;
  welcomeSub: string;
  illustrationTitle: string;
  illustrationSub: string;
  employeePlaceholder: string;
  defaultEmployeeId: string;
};

const CONFIGS: Record<'operator' | 'manager', RoleConfig> = {
  operator: {
    role: 'operator',
    route: '/operator-login',
    icon: HardHat,
    welcomeTitle: 'Welcome back, Operator',
    welcomeSub: 'Sign in to access your shift, equipment, and tasks.',
    illustrationTitle: 'Field Operations',
    illustrationSub: 'Scan, operate, and report — all from your device.',
    employeePlaceholder: 'Email Address',
    defaultEmployeeId: 'elena@caterpillar.com',
  },
  manager: {
    role: 'manager',
    route: '/manager-login',
    icon: Building2,
    welcomeTitle: 'Welcome back, Site Manager',
    welcomeSub: 'Sign in to oversee assets, operators, and operations.',
    illustrationTitle: 'Site Command',
    illustrationSub: 'Full visibility across your rental fleet.',
    employeePlaceholder: 'Email Address',
    defaultEmployeeId: 'manager@example.com',
  },
};

export function LoginScreen({ role }: { role: Role }) {
  const cfg = CONFIGS[role];
  const router = useRouter();
  const { setRole, setToken, setUserId } = useSession();
  const [employeeId, setEmployeeId] = useState(cfg.defaultEmployeeId);
  const [password, setPassword] = useState('password123'); // Pre-filled for demo
  const [loading, setLoading] = useState(false);
  const Icon = cfg.icon;

  const expoPushToken = usePushToken();

  const handleLogin = async () => {
    setLoading(true);
    setRole(role);
    
    // Site Managers bypass live auth for the demo and login instantly
    if (role === 'manager') {
      if (expoPushToken) {
        fetch(`${API_BASE}/api/v1/auth/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: employeeId, token: expoPushToken })
        }).catch(err => console.log('Push token registration skipped/failed:', err));
      }
      
      router.replace('/(manager)/dashboard');
      setLoading(false);
      return;
    }

    // Operators use live authentication flow
    console.log('[Login] Attempting:', `${API_BASE}/api/v1/auth/login`, 'with email:', employeeId);
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: employeeId, password })
      });

      console.log('[Login] Response status:', response.status);

      if (!response.ok) {
        const errBody = await response.text();
        console.log('[Login] Error body:', errBody);
        throw new Error(`Server returned ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      console.log('[Login] Got data keys:', Object.keys(data));
      
      // Use user_id directly from response (backend now returns it)
      setToken(data.access_token);
      setUserId(data.user_id);
      console.log('[Login] userId set to:', data.user_id);
      
      // Fire and forget push token registration
      if (expoPushToken) {
        fetch(`${API_BASE}/api/v1/auth/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: employeeId, token: expoPushToken })
        }).catch(err => console.log('Push token registration skipped/failed:', err));
      }

      // Route the user
      router.replace('/(operator)/home');

    } catch (err) {
      alert("Login failed. Check your email and password.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={PALETTE.textSecondary} strokeWidth={2} />
          </Pressable>

          <View style={styles.illustrationWrap}>
            <View style={styles.illustrationGlow} />
            <View style={styles.illustrationCard}>
              <View style={styles.illustrationIconRow}>
                <View style={styles.illustrationIconBox}>
                  <Icon size={40} color={PALETTE.catYellow} strokeWidth={1.8} />
                </View>
                <View style={styles.lines}>
                  <View style={[styles.line, { width: '80%' }]} />
                  <View style={[styles.line, { width: '55%', opacity: 0.5 }]} />
                  <View style={[styles.line, { width: '70%', opacity: 0.3 }]} />
                </View>
              </View>
              <Text style={styles.illustTitle}>{cfg.illustrationTitle}</Text>
              <Text style={styles.illustSub}>{cfg.illustrationSub}</Text>
            </View>
          </View>

          <View style={styles.formWrap}>
            <Text style={styles.welcomeTitle}>{cfg.welcomeTitle}</Text>
            <Text style={styles.welcomeSub}>{cfg.welcomeSub}</Text>

            <View style={styles.field}>
              <User size={18} color={PALETTE.textTertiary} strokeWidth={2} />
              <TextInput
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder={cfg.employeePlaceholder}
                placeholderTextColor={PALETTE.textTertiary}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Lock size={18} color={PALETTE.textTertiary} strokeWidth={2} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={PALETTE.textTertiary}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable onPress={handleLogin} style={({ pressed }) => [styles.loginBtn, SHADOW.raised, pressed && styles.btnPressed]}>
              <Text style={styles.loginBtnText}>Sign In</Text>
              <ChevronRight size={20} color={PALETTE.textInverse} strokeWidth={2.4} />
            </Pressable>

            <View style={styles.secureRow}>
              <ShieldCheck size={14} color={PALETTE.textTertiary} strokeWidth={2} />
              <Text style={styles.secureText}>Demo access — no credentials required</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.xl },
  backBtn: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm,
  },
  illustrationWrap: { alignItems: 'center', marginTop: SPACING.xxl, marginBottom: SPACING.xxxl, position: 'relative' },
  illustrationGlow: {
    position: 'absolute', width: 240, height: 240, borderRadius: 240,
    backgroundColor: PALETTE.catYellowSoft,
    top: -20,
  },
  illustrationCard: {
    width: '100%',
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    ...SHADOW.raised,
  },
  illustrationIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg },
  illustrationIconBox: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: PALETTE.catYellowSoft,
    borderWidth: 1, borderColor: PALETTE.catYellowBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  lines: { flex: 1, gap: SPACING.sm },
  line: { height: 10, borderRadius: 6, backgroundColor: PALETTE.catYellow },
  illustTitle: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, marginBottom: 4 },
  illustSub: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, lineHeight: 19 },
  formWrap: { flex: 1, gap: SPACING.md },
  welcomeTitle: { fontFamily: FONT.bold, fontSize: 24, color: PALETTE.textPrimary, lineHeight: 30 },
  welcomeSub: { fontFamily: FONT.regular, fontSize: 14, color: PALETTE.textSecondary, lineHeight: 21, marginBottom: SPACING.lg },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border,
    paddingHorizontal: SPACING.md, height: 54,
  },
  input: { flex: 1, fontFamily: FONT.regular, fontSize: 15, color: PALETTE.textPrimary, height: '100%' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: PALETTE.catYellow, borderRadius: RADIUS.lg,
    height: 56, marginTop: SPACING.sm,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginBtnText: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textInverse },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, marginTop: SPACING.lg },
  secureText: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
});
