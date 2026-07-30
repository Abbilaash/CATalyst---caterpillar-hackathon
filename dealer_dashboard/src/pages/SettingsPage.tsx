import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Palette, Database, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageContainer, PageHeader } from '@/components/ui/Page';

export function SettingsPage() {
  return (
    <PageContainer title="Settings">
      <PageHeader title="Settings" subtitle="Configure your CAT Rental Operations Brain workspace." />

      <div className="mx-auto max-w-3xl space-y-4">
        <SettingSection icon={<User className="h-5 w-5" />} title="Profile" delay={0}>
          <Row label="Dealer Name" value="Jordan Diaz" />
          <Row label="Region" value="Southwest — Region 4" />
          <Row label="Role" value="Regional Dealer" />
        </SettingSection>

        <SettingSection icon={<Bell className="h-5 w-5" />} title="Notifications" delay={0.06}>
          <ToggleRow label="Critical alerts" desc="Push notifications for critical equipment" on />
          <ToggleRow label="AI recommendations" desc="Daily executive brief email" on />
          <ToggleRow label="Rental expirations" desc="Alert 48h before rental expiry" on />
          <ToggleRow label="Idle equipment" desc="Notify when idle > 8 hours" />
        </SettingSection>

        <SettingSection icon={<Shield className="h-5 w-5" />} title="Safety & Compliance" delay={0.12}>
          <ToggleRow label="Auto-flag elevated engine temps" desc="Generate alert when engine temp exceeds threshold" on />
          <ToggleRow label="Operator safety score threshold" desc="Flag operators below 85%" on />
        </SettingSection>

        <SettingSection icon={<Palette className="h-5 w-5" />} title="Appearance" delay={0.18}>
          <Row label="Theme" value="Dark Industrial" badge="Default" />
          <Row label="Accent Color" value="CAT Yellow (#FFCD11)" />
          <Row label="Density" value="Comfortable" />
        </SettingSection>

        <SettingSection icon={<Database className="h-5 w-5" />} title="Data & Integrations" delay={0.24}>
          <Row label="Fleet Telemetry" value="CAT Product Link" badge="Connected" tone="ok" />
          <Row label="ERP Sync" value="SAP S/4HANA" badge="Connected" tone="ok" />
          <Row label="Weather Service" value="OpenWeather" badge="Connected" tone="ok" />
        </SettingSection>
      </div>
    </PageContainer>
  );
}

function SettingSection({
  icon, title, children, delay,
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-5"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </motion.div>
  );
}

function Row({ label, value, badge, tone }: { label: string; value: string; badge?: string; tone?: 'ok' }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-ink-200">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-ink-50">{value}</span>
        {badge && <Badge tone={tone === 'ok' ? 'ok' : 'neutral'} dot={tone === 'ok'}>{badge}</Badge>}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, on }: { label: string; desc: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-ink-50">{label}</div>
        <div className="text-xs text-ink-200">{desc}</div>
      </div>
      <button
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-cat-yellow' : 'bg-ink-400'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
