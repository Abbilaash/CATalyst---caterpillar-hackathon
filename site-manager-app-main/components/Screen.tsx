import { View, StyleSheet } from 'react-native';
import { PALETTE } from '@/theme/tokens';

export function Screen({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
});
