import { View, Text, StyleSheet } from 'react-native';
import { ComponentType } from 'react';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';
import { Card } from './Card';

type Props = { Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }> };

export function EmptyState({ Icon }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={28} color={PALETTE.textTertiary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Nothing here yet</Text>
      <Text style={styles.sub}>Items will appear once data is available.</Text>
    </View>
  );
}

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} inset>
          <View style={styles.skRow}>
            <View style={[styles.skBox, styles.shimmer]} />
            <View style={{ flex: 1, gap: SPACING.sm }}>
              <View style={[styles.skLine, { width: '70%' }, styles.shimmer]} />
              <View style={[styles.skLine, { width: '45%' }, styles.shimmer]} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: SPACING.xl },
  iconWrap: {
    width: 64, height: 64, borderRadius: RADIUS.lg,
    backgroundColor: PALETTE.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md,
  },
  title: { fontFamily: FONT.semibold, fontSize: 16, color: PALETTE.textPrimary },
  sub: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: 4, textAlign: 'center' },
  stack: { gap: SPACING.md, padding: SPACING.lg },
  skRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  skBox: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: PALETTE.surfaceOverlay },
  skLine: { height: 12, borderRadius: 6, backgroundColor: PALETTE.surfaceOverlay },
  shimmer: { opacity: 0.6 },
});
