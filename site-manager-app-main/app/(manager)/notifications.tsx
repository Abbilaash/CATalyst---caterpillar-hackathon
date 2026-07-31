import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ArrowLeft, Trash2, CheckCircle2, ShieldAlert, AlertTriangle, Info } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function ManagerNotifications() {
  const router = useRouter();
  const { managerId } = useSession();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ unread: 0, total: 0 });

  const fetchNotifications = async () => {
    try {
      const resolvedManagerId = managerId || 'mgr-01';
      // Query alerts for manager role
      const response = await fetch(`${API_BASE_URL}/api/v1/alerts?role=manager&refresh=true`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setSummary(data.summary || { unread: 0, total: 0 });
      }
    } catch (err) {
      console.warn('Failed to fetch manager notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [managerId]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        // Update local state
        setAlerts(prev =>
          prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
        );
        setSummary((prev: any) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.warn('Failed to mark alert as read:', err);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
      });
      if (response.ok) {
        // Remove from local list
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        setSummary((prev: any) => {
          const removed = alerts.find(a => a.id === alertId);
          const unreadDiff = removed && !removed.isRead ? 1 : 0;
          return {
            total: Math.max(0, prev.total - 1),
            unread: Math.max(0, prev.unread - unreadDiff),
          };
        });
      }
    } catch (err) {
      console.warn('Failed to dismiss alert:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/alerts/read-all?role=manager`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
        setSummary((prev: any) => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return PALETTE.error;
      case 'high':
        return PALETTE.warning;
      case 'medium':
        return PALETTE.catYellow;
      default:
        return PALETTE.info;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return ShieldAlert;
      case 'high':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={PALETTE.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Queue</Text>
        {summary.unread > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.readAllBtn}>
            <Text style={styles.readAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PALETTE.catYellow} />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={48} color={PALETTE.textTertiary} style={{ marginBottom: SPACING.md }} />
          <Text style={styles.emptyTitle}>Queue is empty</Text>
          <Text style={styles.emptySubtitle}>No unread or active notifications for your fleet right now.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {summary.unread} unread • {summary.total} total notifications
            </Text>
          </View>

          {alerts.map((alert) => {
            const SeverityIcon = getSeverityIcon(alert.severity);
            const severityColor = getSeverityColor(alert.severity);

            return (
              <Card key={alert.id} style={[styles.alertCard, !alert.isRead ? styles.unreadCard : {}]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: severityColor + '20' }]}>
                    <SeverityIcon size={18} color={severityColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    {alert.createdAt && (
                      <Text style={styles.alertTime}>
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <Chip
                    label={alert.severity?.toUpperCase()}
                    color={severityColor}
                    soft={`${severityColor}22`}
                    size="sm"
                  />
                </View>

                <Text style={styles.alertMessage}>{alert.message}</Text>

                <View style={styles.actionRow}>
                  {!alert.isRead && (
                    <Pressable
                      onPress={() => handleMarkAsRead(alert.id)}
                      style={({ pressed }) => [styles.actionBtn, styles.readBtn, pressed && styles.pressed]}
                    >
                      <CheckCircle2 size={15} color={PALETTE.success} />
                      <Text style={styles.readBtnText}>Mark read</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleDismiss(alert.id)}
                    style={({ pressed }) => [styles.actionBtn, styles.dismissBtn, pressed && styles.pressed]}
                  >
                    <Trash2 size={15} color={PALETTE.error} />
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.surface,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: PALETTE.textPrimary,
    flex: 1,
  },
  readAllBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  readAllText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: PALETTE.catYellow,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontFamily: FONT.bold,
    fontSize: 18,
    color: PALETTE.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statsBar: {
    marginBottom: SPACING.xs,
  },
  statsText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  alertCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.border,
  },
  unreadCard: {
    borderLeftColor: PALETTE.catYellow,
    backgroundColor: PALETTE.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontFamily: FONT.bold,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  alertTime: {
    fontFamily: FONT.regular,
    fontSize: 11,
    color: PALETTE.textTertiary,
    marginTop: 1,
  },
  alertMessage: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: PALETTE.textSecondary,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm - 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  readBtn: {
    borderColor: PALETTE.success + '44',
    backgroundColor: PALETTE.success + '0a',
  },
  readBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: PALETTE.success,
  },
  dismissBtn: {
    borderColor: PALETTE.error + '44',
    backgroundColor: PALETTE.error + '0a',
  },
  dismissBtnText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    color: PALETTE.error,
  },
  pressed: {
    opacity: 0.8,
  },
});
