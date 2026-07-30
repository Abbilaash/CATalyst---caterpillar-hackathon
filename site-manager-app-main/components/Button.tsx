import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SPACING, TYPO } from '@/theme/tokens';

type Variant = 'solid' | 'outline' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  icon,
  style,
  disabled,
}: Props) {
  const isSolid = variant === 'solid';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';
  const isLarge = size === 'lg';

  const bg = isSolid
    ? PALETTE.catYellow
    : isDanger
      ? PALETTE.errorSoft
      : isOutline
        ? 'transparent'
        : 'transparent';

  const fg = isSolid ? PALETTE.textInverse : isDanger ? PALETTE.error : PALETTE.textPrimary;

  const border = isOutline
    ? PALETTE.borderStrong
    : isDanger
      ? PALETTE.error
      : isSolid
        ? 'transparent'
        : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, borderWidth: isOutline || isDanger ? 1 : 0 },
        isLarge && styles.large,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.label, { color: fg, fontFamily: isSolid ? FONT_BOLD : FONT_MED }]}>{label}</Text>
    </Pressable>
  );
}

import { FONT } from '@/theme/tokens';
const FONT_BOLD = FONT.bold;
const FONT_MED = FONT.medium;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 1,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    minHeight: 48,
    gap: SPACING.sm,
  },
  large: { minHeight: 56, paddingVertical: SPACING.lg, borderRadius: RADIUS.lg },
  label: { fontSize: 15, lineHeight: 19, letterSpacing: 0.2 },
  iconWrap: { marginRight: 2 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
