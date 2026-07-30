import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  onBell?: () => void;
  badge?: number;
  right?: React.ReactNode;
  style?: ViewStyle;
};

export function AppHeader({ title, subtitle, onSearch, onBell, badge, right, style }: Props) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={styles.actions}>
        {right}
        {onSearch && (
          <Pressable onPress={onSearch} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Search size={20} color={PALETTE.textSecondary} strokeWidth={2} />
          </Pressable>
        )}
        {onBell && (
          <Pressable onPress={onBell} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Bell size={20} color={PALETTE.textSecondary} strokeWidth={2} />
            {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  titles: { flex: 1 },
  title: { fontFamily: FONT.bold, fontSize: 22, lineHeight: 27, color: PALETTE.textPrimary },
  subtitle: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 18, color: PALETTE.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: PALETTE.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: FONT.bold, lineHeight: 11 },
});
