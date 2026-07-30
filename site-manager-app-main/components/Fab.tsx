import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SHADOW } from '@/theme/tokens';

type Props = {
  onPress: () => void;
  icon: React.ReactNode;
  style?: ViewStyle;
};

export function Fab({ onPress, icon, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, SHADOW.raised, pressed && styles.pressed, style]}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: PALETTE.catYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.94 }] },
});
