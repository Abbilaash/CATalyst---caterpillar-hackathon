import { View, Text, StyleSheet } from 'react-native';
import { ComponentType } from 'react';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  Icon: IconType;
  label: string;
  value: string;
  accent?: string;
  small?: boolean;
};

export function StatTile({ Icon, label, value, accent = PALETTE.catYellow, small }: Props) {
  return (
    <View style={[styles.tile, small && styles.tileSmall, SHADOW.card]}>
      <View style={[styles.iconBox, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
        <Icon size={small ? 16 : 20} color={accent} strokeWidth={2.2} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.value, small && styles.valueSmall]} numberOfLines={1}>{value}</Text>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    gap: SPACING.sm,
    minHeight: 104,
  },
  tileSmall: { padding: SPACING.md, minHeight: 84, gap: 6 },
  iconBox: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  value: { fontFamily: FONT.bold, fontSize: 22, color: PALETTE.textPrimary, lineHeight: 26 },
  valueSmall: { fontSize: 18, lineHeight: 22 },
  label: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, lineHeight: 16, marginTop: 2 },
});
