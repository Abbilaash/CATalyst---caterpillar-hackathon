import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  HardHat, Building2, Lock, User, ArrowLeft, ChevronRight, ShieldCheck, AlertCircle,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { useSession } from '@/context/SessionContext';
import { usePushToken } from '@/hooks/usePushToken';
import type { Role } from '@/types';
import { API_BASE_URL } from '@/constant/api';

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
    defaultEmployeeId: 'operator@caterpillar.com',
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
    defaultEmployeeId: 'manager@caterpillar.com',
  },
};

// Safe pure JS base64 decoder
const base64Decode = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  let buffer: number | undefined;
  for (let bc = 0, bs = 0, idx = 0; idx < str.length; idx++) {
    const char = str.charAt(idx);
    const charIndex = chars.indexOf(char);
    if (charIndex === -1) continue;
    buffer = bc % 4 ? (buffer ?? 0) * 64 + charIndex : charIndex;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (buffer >> ((-2 * bc) & 6)));
    }
  }
  return output;
};

export function LoginScreen({ role }: { role: Role }) {
  const cfg = CONFIGS[role];
  const router = useRouter();
  const { setRole, setEmail, setToken, setManagerId } = useSession();
  const [employeeId, setEmployeeId] = useState(cfg.defaultEmployeeId);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = cfg.icon;
  const expoPushToken = usePushToken();

  const handleLogin = async () => {
    if (!employeeId.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: employeeId.trim(),
          password: password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'Incorrect email or password.');
        setLoading(false);
        return;
      }

      // Save credentials in SessionContext
      setToken(data.access_token);
      setEmail(employeeId.trim());
      setRole(role);

      // Decode JWT payload to retrieve user id
      let resolvedUserId = 'mgr-01';
      try {
        const payloadBase64 = data.access_token.split('.')[1];
        const decodedPayload = JSON.parse(base64Decode(payloadBase64));
        if (decodedPayload && decodedPayload.sub) {
          resolvedUserId = decodedPayload.sub;
        }
      } catch (jwtErr) {
        console.warn('Could not decode JWT sub payload:', jwtErr);
      }
      setManagerId(resolvedUserId);

      // Register push token
      if (expoPushToken) {
        try {
          await fetch(`${API_BASE_URL}/api/v1/auth/push-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: resolvedUserId, token: expoPushToken })
          });
        } catch (pushErr) {
          console.log('Failed to register push token:', pushErr);
        }
      }

      setLoading(false);
      router.replace(role === 'operator' ? '/(operator)/home' : '/(manager)/dashboard');
    } catch (err: any) {
      console.error('Login connection error:', err);
      setError('Failed to connect to authentication server. Please check your network.');
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

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#FF3333" strokeWidth={2.5} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
                keyboardType="email-address"
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

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [styles.loginBtn, SHADOW.raised, (pressed || loading) && styles.btnPressed]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={PALETTE.textInverse} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <ChevronRight size={20} color={PALETTE.textInverse} strokeWidth={2.4} />
                </>
              )}
            </Pressable>

            <View style={styles.secureRow}>
              <ShieldCheck size={14} color={PALETTE.textTertiary} strokeWidth={2} />
              <Text style={styles.secureText}>Secure Enterprise Login</Text>
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
  errorContainer: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(255, 51, 51, 0.1)',
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255, 51, 51, 0.2)',
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  errorText: { fontFamily: FONT.bold, fontSize: 13, color: '#FF3333', flex: 1 },
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
