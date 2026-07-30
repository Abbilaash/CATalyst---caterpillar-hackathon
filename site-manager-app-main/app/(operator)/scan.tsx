import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated as RNAnimated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import {
  QrCode, ScanLine, Check, AlertTriangle, X, MapPin, User, ShieldCheck, Cpu,
} from 'lucide-react-native';
import { PALETTE, RADIUS, SPACING, SHADOW, FONT } from '@/theme/tokens';
import { Screen } from '@/components/Screen';
import { OperatorShell } from '@/components/OperatorShell';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { EquipmentImage } from '@/components/EquipmentImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CURRENT_ASSET, CURRENT_SITE, CURRENT_OPERATOR } from '@/data/mock';
import { statusColor, statusLabel, checklistColor, checklistLabel } from '@/theme/status';
import type { Asset } from '@/types';

type ScanState = 'idle' | 'scanning' | 'result' | 'problem';

export default function OperatorScan() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>('idle');
  const [confirm, setConfirm] = useState<null | 'assign' | 'cancel' | 'report'>(null);
  const [checklist, setChecklist] = useState<'pending' | 'passed'>('pending');

  const scannedAsset = CURRENT_ASSET!;

  const handleScan = () => {
    setState('scanning');
    setTimeout(() => {
      setState('result');
      setChecklist('passed');
    }, 1800);
  };

  const handleConfirm = () => {
    setConfirm(null);
    router.push('/(operator)/home');
  };

  return (
    <Screen>
      <OperatorShell active="scan">
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppHeader title="Scan QR" subtitle="Verify equipment before operating" />

          {state === 'idle' && <IdleView onScan={handleScan} />}
          {state === 'scanning' && <ScanningView />}
          {state === 'result' && (
            <ResultView
              asset={scannedAsset}
              checklist={checklist}
              onConfirm={() => setConfirm('assign')}
              onReport={() => setConfirm('report')}
              onCancel={() => setConfirm('cancel')}
            />
          )}
        </ScrollView>
      </OperatorShell>

      <ConfirmDialog
        visible={confirm === 'assign'}
        title="Confirm Assignment"
        message={`You are about to confirm assignment for ${scannedAsset.name} (${scannedAsset.machineId}). This will start your operating session.`}
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'report'}
        title="Report Problem"
        message="A problem report will be filed for this equipment. A supervisor will be notified immediately."
        confirmLabel="Report"
        danger
        onConfirm={() => { setConfirm(null); setState('idle'); }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'cancel'}
        title="Cancel Scan"
        message="Discard this scan and return to the scanner?"
        confirmLabel="Discard"
        danger
        onConfirm={() => { setConfirm(null); setState('idle'); }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

function IdleView({ onScan }: { onScan: () => void }) {
  return (
    <View style={styles.idleWrap}>
      <Text style={styles.instruction}>Scan equipment QR code before operating.</Text>
      <Text style={styles.instructionSub}>
        Point your camera at the QR sticker located on the machine's cab or control panel.
      </Text>

      <Pressable onPress={onScan} style={({ pressed }) => [styles.scannerPlaceholder, pressed && styles.pressed]}>
        <ScannerFrame active={false} />
        <View style={styles.scannerHint}>
          <QrCode size={56} color={PALETTE.catYellow} strokeWidth={1.6} />
          <Text style={styles.scannerHintText}>Tap to start scanning</Text>
        </View>
      </Pressable>

      <View style={styles.tipRow}>
        <ShieldCheck size={16} color={PALETTE.success} strokeWidth={2} />
        <Text style={styles.tipText}>Always complete the safety checklist after scanning.</Text>
      </View>
    </View>
  );
}

function ScanningView() {
  return (
    <View style={styles.idleWrap}>
      <Text style={styles.instruction}>Scanning...</Text>
      <Text style={styles.instructionSub}>Hold steady while we read the QR code.</Text>
      <View style={styles.scannerPlaceholder}>
        <ScannerFrame active />
        <View style={styles.scannerHint}>
          <QrCode size={56} color={PALETTE.catYellow} strokeWidth={1.6} opacity={0.5} />
          <Text style={[styles.scannerHintText, { color: PALETTE.catYellow }]}>Reading code...</Text>
        </View>
      </View>
    </View>
  );
}

function ScannerFrame({ active }: { active: boolean }) {
  const lineY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(lineY, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          RNAnimated.timing(lineY, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 },
      );
      loop.start();
      return () => loop.stop();
    }
  }, [active, lineY]);

  const corner = (pos: any) => <View style={[styles.corner, pos]} />;

  return (
    <View style={styles.frame}>
      {corner({ top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 })}
      {corner({ top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 })}
      {corner({ bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 })}
      {corner({ bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 })}
      {active && (
        <RNAnimated.View
          style={[
            styles.scanLine,
            {
              top: lineY.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        >
          <View style={styles.scanLineGlow} />
        </RNAnimated.View>
      )}
    </View>
  );
}

function ResultView({
  asset,
  checklist,
  onConfirm,
  onReport,
  onCancel,
}: {
  asset: Asset;
  checklist: 'pending' | 'passed';
  onConfirm: () => void;
  onReport: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.resultWrap}>
      <View style={styles.scannedBadge}>
        <Check size={18} color={PALETTE.textInverse} strokeWidth={2.6} />
        <Text style={styles.scannedBadgeText}>Equipment Verified</Text>
      </View>

      <Card style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <EquipmentImage seed={asset.imageSeed} size={96} rounded={16} />
          <View style={{ flex: 1, gap: SPACING.xs }}>
            <Text style={styles.resultName}>{asset.name}</Text>
            <Chip label={statusLabel(asset.status)} color={statusColor(asset.status)} soft={`${statusColor(asset.status)}22`} dot />
          </View>
        </View>

        <View style={styles.resultGrid}>
          <ResultField icon={Cpu} label="Machine ID" value={asset.machineId} />
          <ResultField icon={QrCode} label="Rental ID" value={asset.rentalId ?? '—'} />
          <ResultField icon={MapPin} label="Current Site" value={CURRENT_SITE?.name ?? '—'} />
          <ResultField icon={User} label="Assigned Operator" value={CURRENT_OPERATOR.name} />
        </View>

        <View style={styles.checklistRow}>
          <View style={styles.checklistIconBox}>
            <ShieldCheck size={18} color={checklistColor(checklist)} strokeWidth={2.2} />
          </View>
          <Text style={styles.checklistLabel}>Safety Checklist</Text>
          <Chip
            label={checklistLabel(checklist)}
            color={checklistColor(checklist)}
            soft={`${checklistColor(checklist)}22`}
            dot
            size="md"
          />
        </View>
      </Card>

      <View style={styles.resultActions}>
        <Button label="Confirm Assignment" variant="solid" size="lg" icon={<Check size={18} color={PALETTE.textInverse} strokeWidth={2.6} />} onPress={onConfirm} />
        <View style={styles.actionRow}>
          <Button label="Report Problem" variant="danger" icon={<AlertTriangle size={18} color={PALETTE.error} strokeWidth={2.2} />} onPress={onReport} style={{ flex: 1 }} />
          <Button label="Cancel" variant="outline" icon={<X size={18} color={PALETTE.textPrimary} strokeWidth={2.2} />} onPress={onCancel} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

function ResultField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.resultField}>
      <View style={styles.resultFieldIcon}>
        <Icon size={15} color={PALETTE.catYellow} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultFieldLabel}>{label}</Text>
        <Text style={styles.resultFieldValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.lg },
  idleWrap: { gap: SPACING.lg, paddingTop: SPACING.md },
  instruction: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, lineHeight: 24, textAlign: 'center' },
  instructionSub: { fontFamily: FONT.regular, fontSize: 14, color: PALETTE.textSecondary, lineHeight: 20, textAlign: 'center', paddingHorizontal: SPACING.xl },
  scannerPlaceholder: {
    aspectRatio: 1,
    maxWidth: 300,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#0C0E10',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.raised,
  },
  frame: { width: '78%', height: '78%', position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: PALETTE.catYellow, borderRadius: 4 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 3, zIndex: 5 },
  scanLineGlow: { height: 3, backgroundColor: PALETTE.catYellow, shadowColor: PALETTE.catYellow, shadowOpacity: 0.8, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  scannerHint: { position: 'absolute', alignItems: 'center', gap: SPACING.md },
  scannerHintText: { fontFamily: FONT.medium, fontSize: 13, color: PALETTE.textSecondary },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, justifyContent: 'center', marginTop: SPACING.sm },
  tipText: { fontFamily: FONT.regular, fontSize: 13, color: PALETTE.textSecondary },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  resultWrap: { gap: SPACING.lg },
  scannedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: PALETTE.successSoft, borderWidth: 1, borderColor: PALETTE.success + '55', borderRadius: RADIUS.lg, paddingVertical: SPACING.md },
  scannedBadgeText: { fontFamily: FONT.bold, fontSize: 14, color: PALETTE.success },
  resultCard: { gap: SPACING.lg },
  resultHeader: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'flex-start' },
  resultName: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, lineHeight: 23 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  resultField: { width: '47%', flexGrow: 1, flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  resultFieldIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: PALETTE.catYellowSoft, alignItems: 'center', justifyContent: 'center' },
  resultFieldLabel: { fontFamily: FONT.regular, fontSize: 11, color: PALETTE.textTertiary },
  resultFieldValue: { fontFamily: FONT.semibold, fontSize: 14, color: PALETTE.textPrimary, lineHeight: 18 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingTop: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: PALETTE.border },
  checklistIconBox: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: PALETTE.surfaceOverlay, alignItems: 'center', justifyContent: 'center' },
  checklistLabel: { flex: 1, fontFamily: FONT.medium, fontSize: 14, color: PALETTE.textPrimary },
  resultActions: { gap: SPACING.md, marginTop: SPACING.sm },
  actionRow: { flexDirection: 'row', gap: SPACING.md },
});
