import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';
import { Card } from './Card';

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
};

export function InfoRow({ icon, label, value, sublabel, accent, right, chevron, onPress }: Props) {
  const Wrap = onPress ? (Card as any) : View;
  return (
    <View style={[onPress ? null : styles.plainWrap] as ViewStyle[]}>
      <Card style={[styles.row, onPress && styles.pressable] as any}>
        <View style={[styles.iconBox, accent ? { backgroundColor: accent + '22', borderColor: accent + '44' } : null]}>
          {icon}
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={2}>{value}</Text>
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
        {right}
        {chevron && <ChevronRight size={18} color={PALETTE.textTertiary} strokeWidth={2} />}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  plainWrap: { gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  pressable: { marginBottom: 0 },
  iconBox: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: PALETTE.surfaceOverlay,
    borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  label: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary, marginBottom: 2 },
  value: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20, color: PALETTE.textPrimary },
  sublabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, marginTop: 2 },
});
