import { View, Text, StyleSheet } from 'react-native';
import { PALETTE, RADIUS, FONT } from '@/theme/tokens';

type Props = {
  name: string;
  seed?: string;
  size?: number;
  showRing?: boolean;
};

// Deterministic initials avatar with industrial gradient backdrop.
export function Avatar({ name, size = 44, showRing }: Props) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        showRing && styles.ring,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PALETTE.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderColor: PALETTE.catYellow, borderWidth: 2 },
  initials: { fontFamily: FONT.bold, color: PALETTE.catYellow, lineHeight: 0 },
});
