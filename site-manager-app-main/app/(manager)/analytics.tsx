import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrendingUp, BarChart2, Shield, Wrench, Clock, Zap, Percent, Hammer
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

export default function ManagerAnalytics() {
  const { managerId } = useSession();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const resolvedManagerId = managerId || 'mgr-01';
        const response = await fetch(`${API_BASE_URL}/api/v1/manager/analytics/${resolvedManagerId}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.warn('Failed to load telemetry analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [managerId]);

  if (loading) {
    return (
      <Screen>
        <ManagerShell active="analytics">
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PALETTE.catYellow} />
          </View>
        </ManagerShell>
      </Screen>
    );
  }

  const stats = analyticsData?.stats || {
    totalAssets: 8,
    activeRentals: 8,
    machinesWorking: 4,
    machinesIdle: 4,
    operatorsOnDuty: 5,
    runningOperations: 3,
    maintenanceDue: 0,
    safetyAlerts: 0,
  };

  const utilizationRate = analyticsData?.utilizationRate ?? 0;
  const complianceScore = analyticsData?.complianceScore ?? 98.4;
  const idleFuelRate = analyticsData?.idleFuelRate ?? 14.2;
  const uptimeRatios = analyticsData?.uptimeRatios || [];

  return (
    <Screen>
      <ManagerShell active="analytics">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Analytics" subtitle="Fleet performance & site metrics" />

          {/* Core Utilization Card */}
          <Card style={styles.utilCard}>
            <View style={styles.utilHeader}>
              <View style={styles.iconBox}>
                <TrendingUp size={20} color={PALETTE.catYellow} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.utilLabel}>Overall Utilization</Text>
                <Text style={styles.utilSub}>Target utilization: 85%</Text>
              </View>
              <Text style={styles.utilVal}>{utilizationRate}%</Text>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { width: `${utilizationRate}%` }]} />
            </View>
          </Card>

          {/* Stats Grid */}
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <Card style={styles.gridCard}>
                <Clock size={20} color={PALETTE.catYellow} />
                <Text style={styles.gridNum}>{stats.machinesWorking}</Text>
                <Text style={styles.gridLabel}>Active Machines</Text>
              </Card>
              <Card style={styles.gridCard}>
                <Wrench size={20} color={PALETTE.warning} />
                <Text style={styles.gridNum}>{stats.maintenanceDue}</Text>
                <Text style={styles.gridLabel}>Pending Maint.</Text>
              </Card>
            </View>

            <View style={styles.gridCol}>
              <Card style={styles.gridCard}>
                <Zap size={20} color={PALETTE.success} />
                <Text style={styles.gridNum}>{stats.runningOperations}</Text>
                <Text style={styles.gridLabel}>Running Jobs</Text>
              </Card>
              <Card style={styles.gridCard}>
                <Shield size={20} color={PALETTE.error} />
                <Text style={styles.gridNum}>{stats.safetyAlerts}</Text>
                <Text style={styles.gridLabel}>Safety Alerts</Text>
              </Card>
            </View>
          </View>

          {/* Machine Productivity Bar Charts */}
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Downtime vs Uptime</Text>
            <Text style={styles.chartSub}>Weekly aggregate index (Uptime %)</Text>
            
            <View style={styles.chartContent}>
              {uptimeRatios.map((item: any, idx: number) => {
                const color = item.value >= 80 ? PALETTE.success : (item.value >= 60 ? PALETTE.catYellow : PALETTE.warning);
                return (
                  <BarRow key={idx} label={item.label} value={item.value} color={color} />
                );
              })}
            </View>
          </Card>

          {/* Operational Health */}
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>Safety & Compliance</Text>
            <View style={styles.complianceRow}>
              <Percent size={18} color={PALETTE.success} />
              <Text style={styles.complianceText}>Compliance Score</Text>
              <Text style={styles.complianceVal}>{complianceScore}%</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.complianceRow}>
              <Hammer size={18} color={PALETTE.catYellow} />
              <Text style={styles.complianceText}>Idle Fuel Consumption</Text>
              <Text style={styles.complianceVal}>{idleFuelRate} L/h</Text>
            </View>
          </Card>
        </ScrollView>
      </ManagerShell>
    </Screen>
  );
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barVal}>{value}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  utilCard: { padding: SPACING.lg, gap: SPACING.md },
  utilHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  iconBox: { width: 42, height: 42, borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, alignItems: 'center', justifyContent: 'center' },
  utilLabel: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary },
  utilSub: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, marginTop: 1 },
  utilVal: { fontFamily: FONT.bold, fontSize: 24, color: PALETTE.catYellow, marginLeft: 'auto' },
  barContainer: { height: 8, backgroundColor: PALETTE.border, borderRadius: RADIUS.sm, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: PALETTE.catYellow, borderRadius: RADIUS.sm },
  
  grid: { flexDirection: 'row', gap: SPACING.md },
  gridCol: { flex: 1, gap: SPACING.md },
  gridCard: { padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs },
  gridNum: { fontFamily: FONT.bold, fontSize: 28, color: PALETTE.textPrimary, marginTop: SPACING.xs },
  gridLabel: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary },

  chartCard: { padding: SPACING.lg, gap: SPACING.xs },
  chartTitle: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary },
  chartSub: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textSecondary, marginBottom: SPACING.sm },
  chartContent: { gap: SPACING.md },

  barRow: { gap: SPACING.xs },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary },
  barVal: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textSecondary },
  barTrack: { height: 6, backgroundColor: PALETTE.border, borderRadius: RADIUS.sm },
  barFill: { height: '100%', borderRadius: RADIUS.sm },

  complianceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.xs },
  complianceText: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary, flex: 1 },
  complianceVal: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.textPrimary },
  divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: SPACING.sm },
});
