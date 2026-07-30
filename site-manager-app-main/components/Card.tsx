import { View, StyleSheet, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SHADOW } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  inset?: boolean;
  raised?: boolean;
  glow?: boolean;
};

export function Card({ children, style, inset, raised, glow }: Props) {
  return (
    <View
      style={[
        styles.card,
        SHADOW.card,
        raised && SHADOW.raised,
        glow && SHADOW.glow,
        inset && styles.inset,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  inset: { padding: 14 },
});
