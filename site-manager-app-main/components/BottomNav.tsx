import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ComponentType } from 'react';
import { PALETTE, FONT } from '@/theme/tokens';
import type { Role } from '@/types';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Tab = {
  name: string;
  label: string;
  icon: IconType;
  roles: Role[];
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (name: string) => void;
  role: Role;
};

export function BottomNav({ tabs, active, onChange, role }: Props) {
  const visible = tabs.filter((t) => t.roles.includes(role));
  return (
    <View style={styles.bar}>
      {visible.map((tab) => {
        const isActive = tab.name === active;
        return <TabButton key={tab.name} tab={tab} isActive={isActive} onPress={() => onChange(tab.name)} />;
      })}
    </View>
  );
}

function TabButton({ tab, isActive, onPress }: { tab: Tab; isActive: boolean; onPress: () => void }) {
  const Icon = tab.icon;
  const color = isActive ? PALETTE.catYellow : PALETTE.textTertiary;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tabBtn, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
        <Icon size={22} color={color} strokeWidth={isActive ? 2.4 : 2} />
      </View>
      <Text style={[styles.label, { color, opacity: isActive ? 1 : 0.6 }]}>{tab.label}</Text>
      {isActive && <View style={styles.indicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PALETTE.border,
    paddingBottom: 6,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 4, position: 'relative' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  iconWrap: { width: 44, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  iconWrapActive: { backgroundColor: PALETTE.catYellowSoft },
  label: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 13 },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: PALETTE.catYellow,
  },
});
