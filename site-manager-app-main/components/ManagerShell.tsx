import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LayoutDashboard, Boxes, Users, Activity, TrendingUp } from 'lucide-react-native';
import { PALETTE } from '@/theme/tokens';
import { BottomNav } from '@/components/BottomNav';
import type { Role } from '@/types';

const TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['manager'] as Role[] },
  { name: 'assets', label: 'Assets', icon: Boxes, roles: ['manager'] as Role[] },
  { name: 'scheduling', label: 'Scheduling', icon: Users, roles: ['manager'] as Role[] },
  { name: 'operations', label: 'Operations', icon: Activity, roles: ['manager'] as Role[] },
  { name: 'analytics', label: 'Analytics', icon: TrendingUp, roles: ['manager'] as Role[] },
];

const ROUTES: Record<string, Href> = {
  dashboard: '/(manager)/dashboard',
  assets: '/(manager)/assets',
  scheduling: '/(manager)/scheduling',
  operations: '/(manager)/operations',
  analytics: '/(manager)/analytics',
};

type Props = {
  active: string;
  children: React.ReactNode;
};

export function ManagerShell({ active, children }: Props) {
  const router = useRouter();
  return (
    <View style={styles.shell}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav tabs={TABS} active={active} onChange={(name) => router.push(ROUTES[name] as Href)} role="manager" />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: PALETTE.bg },
});
