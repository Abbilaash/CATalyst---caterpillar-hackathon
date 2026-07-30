import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { HardHat, Building2, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>CAT</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>Rental Operations</Text>
            <Text style={styles.brandSub}>Dealer Equipment Management System</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choose your role</Text>
          <Text style={styles.heroSub}>
            Select how you'll be working today to continue.
          </Text>
        </View>

        <View style={styles.cards}>
          <RoleCard
            Icon={HardHat}
            emoji="👷"
            title="Operator"
            desc="Operate equipment, complete tasks, and report issues from the field."
            onPress={() => router.push('/operator-login')}
          />
          <RoleCard
            Icon={Building2}
            emoji="🏗"
            title="Site Manager"
            desc="Monitor assets, operators, and running operations across your site."
            onPress={() => router.push('/manager-login')}
          />
        </View>

        <View style={styles.footer}>
          <ShieldCheck size={14} color={PALETTE.textTertiary} strokeWidth={2} />
          <Text style={styles.footerText}>Secured by Caterpillar Dealer Network</Text>
        </View>
      </View>
    </Screen>
  );
}

function RoleCard({
  Icon,
  emoji,
  title,
  desc,
  onPress,
}: {
  Icon: any;
  emoji: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}>
      <View style={styles.card}>
        <View style={styles.cardIconRow}>
          <View style={styles.cardIconBox}>
            <Icon size={28} color={PALETTE.catYellow} strokeWidth={2} />
          </View>
          <View style={styles.cardArrow}>
            <ChevronRight size={20} color={PALETTE.catYellow} strokeWidth={2.4} />
          </View>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.xl, justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xxl },
  logoMark: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    backgroundColor: PALETTE.catYellow,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: FONT.bold, fontSize: 20, color: PALETTE.textInverse },
  brandText: { flex: 1 },
  brandTitle: { fontFamily: FONT.bold, fontSize: 20, color: PALETTE.textPrimary, lineHeight: 24 },
  brandSub: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, marginTop: 2 },
  hero: { marginTop: SPACING.xxxl },
  heroTitle: { fontFamily: FONT.bold, fontSize: 30, color: PALETTE.textPrimary, lineHeight: 36 },
  heroSub: { fontFamily: FONT.regular, fontSize: 15, color: PALETTE.textSecondary, marginTop: SPACING.sm, lineHeight: 22 },
  cards: { gap: SPACING.lg, flex: 1, justifyContent: 'center' },
  cardWrap: { borderRadius: RADIUS.xl, ...SHADOW.raised },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  cardIconBox: {
    width: 56, height: 56, borderRadius: RADIUS.lg,
    backgroundColor: PALETTE.catYellowSoft,
    borderWidth: 1, borderColor: PALETTE.catYellowBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cardArrow: { width: 36, height: 36, borderRadius: 999, backgroundColor: PALETTE.surfaceOverlay, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: FONT.bold, fontSize: 22, color: PALETTE.textPrimary, lineHeight: 27 },
  cardDesc: { fontFamily: FONT.regular, fontSize: 14, color: PALETTE.textSecondary, marginTop: SPACING.sm, lineHeight: 21 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.lg },
  footerText: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
});
