import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Easing } from 'react-native';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';

type Props = {
  value: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
};

export function ProgressBar({
  value,
  color = PALETTE.catYellow,
  height = 8,
  showLabel,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const widthAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(widthAnim, {
      toValue: clamped,
      duration: 700,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  return (
    <View style={styles.row}>
      <View style={[styles.track, { height }]}>
        <RNAnimated.View
          style={[styles.fill, { backgroundColor: color, height }, {
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{Math.round(clamped)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  track: {
    flex: 1,
    backgroundColor: PALETTE.surfaceOverlay,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: { borderRadius: RADIUS.pill },
  label: { fontFamily: FONT.semibold, fontSize: 12, lineHeight: 16, minWidth: 36, textAlign: 'right' },
});
