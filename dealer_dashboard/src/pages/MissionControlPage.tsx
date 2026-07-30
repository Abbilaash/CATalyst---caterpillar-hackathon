import { PageContainer } from '@/components/ui/Page';
import { ExecutiveBrief } from '@/components/mission/ExecutiveBrief';
import { KPICard } from '@/components/mission/KPICard';
import { DecisionCenterSection } from '@/components/mission/RecommendationCard';
import { FleetStatusTable } from '@/components/mission/FleetStatusTable';
import { ActivityTimeline } from '@/components/mission/ActivityTimeline';
import { DemandForecastChart } from '@/components/mission/DemandForecastChart';
import { KPIs, recommendations } from '@/data/mock';

export function MissionControlPage() {
  const k = KPIs;
  return (
    <PageContainer title="Mission Control">
      <div className="space-y-6">
        <ExecutiveBrief />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KPICard label="Fleet Utilization" value={k.fleetUtilization.value} suffix="%" decimals={1} delta={k.fleetUtilization.delta} trend={k.fleetUtilization.trend} delay={0} accent />
          <KPICard label="Revenue At Risk" value={k.revenueAtRisk.value} currency delta={k.revenueAtRisk.delta} trend={k.revenueAtRisk.trend} delay={0.05} />
          <KPICard label="Idle Equipment" value={k.idleEquipment.value} delta={k.idleEquipment.delta} trend={k.idleEquipment.trend} delay={0.1} />
          <KPICard label="Active Rentals" value={k.activeRentals.value} delta={k.activeRentals.delta} trend={k.activeRentals.trend} delay={0.15} />
          <KPICard label="Rental Expiring" value={k.rentalExpiring.value} delta={k.rentalExpiring.delta} trend={k.rentalExpiring.trend} delay={0.2} />
          <KPICard label="Safety Alerts" value={k.safetyAlerts.value} delta={k.safetyAlerts.delta} trend={k.safetyAlerts.trend} delay={0.25} />
        </div>

        <DecisionCenterSection recs={recommendations} limit={3} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FleetStatusTable />
          </div>
          <div className="xl:col-span-1">
            <ActivityTimeline />
          </div>
        </div>

        <DemandForecastChart />
      </div>
    </PageContainer>
  );
}
