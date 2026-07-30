import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';

type Props = {
  label: string;
  color: string;
  soft?: string;
  size?: 'sm' | 'md';
  dot?: boolean;
};

export function Chip({ label, color, soft, size = 'sm', dot }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: soft ?? `${color}22`, borderColor: `${color}55` },
        size === 'md' && styles.md,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.label, { color }, size === 'md' && styles.labelMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: SPACING.xs + 1,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  md: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  dot: { width: 6, height: 6, borderRadius: 999 },
  label: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
  labelMd: { fontSize: 13, lineHeight: 16 },
});
