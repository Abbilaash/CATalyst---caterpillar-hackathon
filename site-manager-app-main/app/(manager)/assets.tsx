import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Boxes, ChevronDown, Cpu, MapPin, User, Heart, Gauge, Timer, Eye, X } from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { ManagerShell } from '@/components/ManagerShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { SearchBar } from '@/components/SearchBar';
import { EquipmentImage } from '@/components/EquipmentImage';
import { EmptyState } from '@/components/States';
import { ASSETS, siteById, operatorById } from '@/data/mock';
import { statusColor, statusLabel, rentalColor, rentalLabel, healthColor } from '@/theme/status';
import type { Asset, EquipmentStatus, RentalStatus } from '@/types';
import { useSession } from '@/context/SessionContext';
import { API_BASE_URL } from '@/constant/api';

type SortKey = 'name' | 'health' | 'hours';

const STATUS_FILTERS: { key: EquipmentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'working', label: 'Working' },
  { key: 'idle', label: 'Idle' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'available', label: 'Available' },
];

export default function ManagerAssets() {
  const { managerId } = useSession();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [sortOpen, setSortOpen] = useState(false);
  const [quickView, setQuickView] = useState<Asset | null>(null);
  const [assetsList, setAssetsList] = useState<Asset[]>(ASSETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const resolvedManagerId = managerId || 'mgr-01';
        const response = await fetch(`${API_BASE_URL}/api/v1/manager/assets/${resolvedManagerId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setAssetsList(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load assets from backend, using mock:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, [managerId]);

  const filtered = useMemo(() => {
    let list = assetsList.filter((a) => {
      const matchesQuery =
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.machineId.toLowerCase().includes(query.toLowerCase()) ||
        a.assetType.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'health') return b.healthScore - a.healthScore;
      if (sort === 'hours') return a.engineHours - b.engineHours;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [assetsList, query, statusFilter, sort]);

  const sortLabel = { name: 'Name A-Z', health: 'Health: High-Low', hours: 'Engine: Low-High' }[sort];

  return (
    <Screen>
      <ManagerShell active="assets">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
          <View style={styles.stickyHeader}>
            <AppHeader title="Assets" subtitle={`${filtered.length} of ${ASSETS.length} equipment`} onBell={() => {}} />
            <View style={styles.controls}>
              <SearchBar value={query} onChangeText={setQuery} placeholder="Search machines, IDs, types..." />
              <Pressable onPress={() => setSortOpen((v) => !v)} style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}>
                <Text style={styles.sortLabel} numberOfLines={1}>{sortLabel}</Text>
                <ChevronDown size={15} color={PALETTE.textSecondary} strokeWidth={2.2} />
              </Pressable>
              {sortOpen && (
                <View style={styles.sortMenu}>
                  {(['name', 'health', 'hours'] as SortKey[]).map((k) => (
                    <Pressable key={k} onPress={() => { setSort(k); setSortOpen(false); }} style={({ pressed }) => [styles.sortItem, pressed && styles.pressed]}>
                      <Text style={[styles.sortItemText, sort === k && styles.sortItemActive]}>
                        {({ name: 'Name A-Z', health: 'Health: High-Low', hours: 'Engine: Low-High' } as const)[k]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {STATUS_FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setStatusFilter(f.key)}
                  style={({ pressed }) => [styles.filterChip, statusFilter === f.key && styles.filterChipActive, pressed && styles.pressed]}
                >
                  <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {filtered.length === 0 ? (
            <EmptyState Icon={Boxes} />
          ) : (
            <View style={styles.list}>
              {filtered.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onQuickView={() => setQuickView(asset)} />
              ))}
            </View>
          )}
        </ScrollView>
      </ManagerShell>

      {quickView && <QuickViewSheet asset={quickView} onClose={() => setQuickView(null)} />}
    </Screen>
  );
}

function AssetCard({ asset, onQuickView }: { asset: Asset; onQuickView: () => void }) {
  const site = siteById(asset.siteId);
  const opName = (asset as any).assignedOperatorName || (asset.assignedOperatorId ? 'Operator' : undefined);
  const sColor = statusColor(asset.status);

  return (
    <Card style={styles.assetCard}>
      <View style={styles.assetTop}>
        <EquipmentImage seed={asset.imageSeed} size={80} rounded={14} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.assetName} numberOfLines={2}>{asset.name}</Text>
          <Text style={styles.assetMeta}>Machine ID · {asset.machineId}</Text>
          <View style={styles.assetChips}>
            <Chip label={asset.assetType} color={PALETTE.catYellow} soft={PALETTE.catYellowSoft} />
            <Chip label={statusLabel(asset.status)} color={sColor} soft={`${sColor}22`} dot />
          </View>
        </View>
      </View>

      <View style={styles.assetMid}>
        <Chip label={rentalLabel(asset.rentalStatus)} color={rentalColor(asset.rentalStatus)} soft={`${rentalColor(asset.rentalStatus)}22`} dot />
        <Text style={styles.assetRental}>{asset.rentalId}</Text>
      </View>

      <View style={styles.assetInfoRow}>
        <InfoPill Icon={MapPin} label="Site" value={site?.name ?? '—'} />
        <InfoPill Icon={User} label="Operator" value={opName ?? 'Unassigned'} />
      </View>

      <View style={styles.assetMetrics}>
        <Metric Icon={Heart} label="Health" value={`${asset.healthScore}%`} color={healthColor(asset.healthScore)} />
        <Metric Icon={Timer} label="Idle" value={`${asset.idleHours}h`} color={PALETTE.warning} />
        <Metric Icon={Gauge} label="Engine" value={`${asset.engineHours}h`} color={PALETTE.info} />
      </View>

      <Pressable onPress={onQuickView} style={({ pressed }) => [styles.quickViewBtn, pressed && styles.pressed]}>
        <Eye size={16} color={PALETTE.catYellow} strokeWidth={2.2} />
        <Text style={styles.quickViewText}>Quick View</Text>
        <ChevronDown size={14} color={PALETTE.textTertiary} strokeWidth={2.2} style={{ marginLeft: 'auto', transform: [{ rotate: '180deg' }] }} />
      </Pressable>
    </Card>
  );
}

function InfoPill({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <View style={styles.infoPillIcon}>
        <Icon size={13} color={PALETTE.textSecondary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoPillLabel}>{label}</Text>
        <Text style={styles.infoPillValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function Metric({ Icon, label, value, color }: { Icon: any; label: string; value: string; color: string }) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: color + '22' }]}>
        <Icon size={14} color={color} strokeWidth={2.2} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickViewSheet({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const site = siteById(asset.siteId);
  const opName = (asset as any).assignedOperatorName || (asset.assignedOperatorId ? 'Operator' : undefined);
  return (
    <View style={styles.sheetBackdrop}>
      <Pressable style={styles.sheetBackdropPress} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <EquipmentImage seed={asset.imageSeed} size={64} rounded={12} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.sheetName}>{asset.name}</Text>
            <Text style={styles.sheetMeta}>{asset.machineId} · {asset.rentalId}</Text>
            <View style={styles.sheetChips}>
              <Chip label={statusLabel(asset.status)} color={statusColor(asset.status)} soft={`${statusColor(asset.status)}22`} dot />
              <Chip label={rentalLabel(asset.rentalStatus)} color={rentalColor(asset.rentalStatus)} soft={`${rentalColor(asset.rentalStatus)}22`} dot />
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.sheetClose}>
            <X size={18} color={PALETTE.textSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={styles.sheetMetrics}>
          <Metric Icon={Heart} label="Health" value={`${asset.healthScore}%`} color={healthColor(asset.healthScore)} />
          <Metric Icon={Timer} label="Idle" value={`${asset.idleHours}h`} color={PALETTE.warning} />
          <Metric Icon={Gauge} label="Engine" value={`${asset.engineHours}h`} color={PALETTE.info} />
        </View>
        <View style={styles.sheetInfo}>
          <InfoPill Icon={MapPin} label="Current Site" value={site?.name ?? '—'} />
          <View style={{ height: SPACING.md }} />
          <InfoPill Icon={User} label="Assigned Operator" value={opName ?? 'Unassigned'} />
          <View style={{ height: SPACING.md }} />
          <InfoPill Icon={Cpu} label="Asset Type" value={asset.assetType} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  stickyHeader: { backgroundColor: PALETTE.bg, paddingBottom: SPACING.md, gap: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  controls: { gap: SPACING.sm, position: 'relative', zIndex: 10 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: PALETTE.surface, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.border, paddingHorizontal: SPACING.md, height: 44 },
  sortLabel: { fontFamily: FONT.medium, fontSize: 13, color: PALETTE.textPrimary },
  sortMenu: { position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: PALETTE.surfaceRaised, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.borderStrong, padding: SPACING.xs, zIndex: 20, ...SHADOW.raised },
  sortItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm },
  sortItemText: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary },
  sortItemActive: { color: PALETTE.catYellow, fontFamily: FONT.semibold },
  filterRow: { gap: SPACING.sm, paddingHorizontal: SPACING.xs },
  filterChip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.pill, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.border },
  filterChipActive: { backgroundColor: PALETTE.catYellowSoft, borderColor: PALETTE.catYellowBorder },
  filterText: { fontFamily: FONT.medium, fontSize: 12, color: PALETTE.textSecondary },
  filterTextActive: { color: PALETTE.catYellow },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  assetCard: { gap: SPACING.md },
  assetTop: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'flex-start' },
  assetName: { fontFamily: FONT.bold, fontSize: 16, color: PALETTE.textPrimary, lineHeight: 21 },
  assetMeta: { fontFamily: FONT.regular, fontSize: 12, color: PALETTE.textTertiary },
  assetChips: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4, flexWrap: 'wrap' },
  assetMid: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  assetRental: { fontFamily: FONT.medium, fontSize: 13, color: PALETTE.textSecondary },
  assetInfoRow: { flexDirection: 'row', gap: SPACING.md },
  infoPill: { flex: 1, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center', backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.md, padding: SPACING.sm },
  infoPillIcon: { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: PALETTE.surface, alignItems: 'center', justifyContent: 'center' },
  infoPillLabel: { fontFamily: FONT.regular, fontSize: 10, color: PALETTE.textTertiary },
  infoPillValue: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.textPrimary, lineHeight: 16 },
  assetMetrics: { flexDirection: 'row', gap: SPACING.md },
  metric: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: PALETTE.surfaceOverlay, borderRadius: RADIUS.md, paddingVertical: SPACING.md },
  metricIcon: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: FONT.bold, fontSize: 15, color: PALETTE.textPrimary },
  metricLabel: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textSecondary },
  quickViewBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: PALETTE.catYellowSoft, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.catYellowBorder, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  quickViewText: { fontFamily: FONT.semibold, fontSize: 13, color: PALETTE.catYellow },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  sheetBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 100 },
  sheetBackdropPress: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: PALETTE.surfaceRaised, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xxl, borderWidth: StyleSheet.hairlineWidth, borderColor: PALETTE.borderStrong, gap: SPACING.lg },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: PALETTE.borderStrong, alignSelf: 'center', marginBottom: SPACING.sm },
  sheetHeader: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  sheetName: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, lineHeight: 23 },
  sheetMeta: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary },
  sheetChips: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  sheetClose: { width: 36, height: 36, borderRadius: 999, backgroundColor: PALETTE.surfaceOverlay, alignItems: 'center', justifyContent: 'center' },
  sheetMetrics: { flexDirection: 'row', gap: SPACING.md },
  sheetInfo: { gap: 0 },
});
