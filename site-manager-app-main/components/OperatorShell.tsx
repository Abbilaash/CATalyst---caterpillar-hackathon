import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Home, QrCode, ListChecks, User } from 'lucide-react-native';
import { PALETTE } from '@/theme/tokens';
import { BottomNav } from '@/components/BottomNav';
import type { Role } from '@/types';

const TABS = [
  { name: 'home', label: 'Home', icon: Home, roles: ['operator'] as Role[] },
  { name: 'scan', label: 'Scan QR', icon: QrCode, roles: ['operator'] as Role[] },
  { name: 'tasks', label: 'My Tasks', icon: ListChecks, roles: ['operator'] as Role[] },
  { name: 'profile', label: 'Profile', icon: User, roles: ['operator'] as Role[] },
];

const ROUTES: Record<string, string> = {
  home: '/(operator)/home',
  scan: '/(operator)/scan',
  tasks: '/(operator)/tasks',
  profile: '/(operator)/profile',
};

type Props = {
  active: string;
  children: React.ReactNode;
};

export function OperatorShell({ active, children }: Props) {
  const router = useRouter();
  return (
    <View style={styles.shell}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomNav tabs={TABS} active={active} onChange={(name) => router.push(ROUTES[name])} role="operator" />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: PALETTE.bg },
});
