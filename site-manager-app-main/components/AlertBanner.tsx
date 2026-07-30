import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Clock, X, Info } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  actionUrl?: string;
}

export function AlertBanner({ role }: { role: string }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const userId = role === 'operator' ? 'john.doe@caterpillar.com' : 'mike.smith@caterpillar.com';
        const apiBase = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
        
        const response = await fetch(`${apiBase}/api/v1/alerts?role=${role}&user_id=${userId}`);
        const data = await response.json();
        setAlerts(data.alerts || []);
      } catch (e) {
        console.log('Failed to fetch alerts:', e);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const dismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      const apiBase = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
      await fetch(`${apiBase}/api/v1/alerts/${id}/dismiss`, { method: 'PATCH' });
    } catch (e) {}
  };

  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical' || alert.severity === 'high';
        const isWarning = alert.severity === 'medium';
        const bgColor = isCritical ? PALETTE.errorSoft : isWarning ? PALETTE.warningSoft : PALETTE.catYellowSoft;
        const borderColor = isCritical ? PALETTE.error : isWarning ? PALETTE.warning : PALETTE.catYellowBorder;
        const iconColor = isCritical ? PALETTE.error : isWarning ? PALETTE.warning : PALETTE.catYellow;
        const Icon = isCritical ? AlertTriangle : isWarning ? Info : Clock;

        return (
          <Pressable
            key={alert.id}
            onPress={() => alert.actionUrl && router.push(alert.actionUrl as any)}
            style={({ pressed }) => [
              styles.alertCard,
              { backgroundColor: bgColor, borderColor: borderColor + '80' },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.iconBox}>
              <Icon size={20} color={iconColor} strokeWidth={2.5} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{alert.title}</Text>
              <Text style={styles.message}>{alert.message}</Text>
            </View>
            <Pressable onPress={() => dismiss(alert.id)} style={styles.closeBtn}>
              <X size={18} color={PALETTE.textSecondary} />
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.md, marginBottom: SPACING.md },
  pressed: { opacity: 0.8 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  title: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary, marginBottom: 2 },
  message: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary, lineHeight: 18 },
  closeBtn: { padding: SPACING.xs },
});
