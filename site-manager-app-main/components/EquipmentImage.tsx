import { PALETTE } from '@/theme/tokens';
import { View, StyleSheet } from 'react-native';

type Props = {
  seed?: string;
  size?: number;
  rounded?: number;
};

// Geometric industrial equipment placeholder tinted with CAT yellow.
export function EquipmentImage({ size = 96, rounded = 14 }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: rounded },
      ]}
    >
      <View style={styles.bars}>
        <View style={[styles.bar, { width: size * 0.46 }]} />
        <View style={[styles.bar, { width: size * 0.32, opacity: 0.6 }]} />
        <View style={[styles.bar, { width: size * 0.58, opacity: 0.3 }]} />
      </View>
      <View style={[styles.body, { width: size * 0.5, height: size * 0.34 }]} />
      <View
        style={[
          styles.wheel,
          { width: size * 0.16, height: size * 0.16, bottom: size * 0.1, left: size * 0.16 },
        ]}
      />
      <View
        style={[
          styles.wheel,
          { width: size * 0.16, height: size * 0.16, bottom: size * 0.1, right: size * 0.16 },
        ]}
      />
      <View
        style={[
          styles.arm,
          { width: size * 0.08, height: size * 0.4, top: size * 0.12, right: size * 0.12 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#262A2F',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  bars: { position: 'absolute', top: 8, left: 8, gap: 4 },
  bar: { height: 5, backgroundColor: PALETTE.catYellow, borderRadius: 2 },
  body: {
    backgroundColor: PALETTE.catYellowDeep,
    borderRadius: 4,
    position: 'absolute',
    bottom: '22%',
  },
  wheel: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#111315',
    borderWidth: 2,
    borderColor: PALETTE.catYellow,
  },
  arm: {
    position: 'absolute',
    backgroundColor: PALETTE.catYellow,
    borderRadius: 3,
    transform: [{ rotate: '20deg' }],
  },
});
