import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { PALETTE, RADIUS, SPACING, FONT } from '@/theme/tokens';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="outline" onPress={onCancel} style={{ flex: 1 }} />
            <Button
              label={confirmLabel}
              variant={danger ? 'danger' : 'solid'}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: PALETTE.surfaceRaised,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.borderStrong,
  },
  title: { fontFamily: FONT.bold, fontSize: 18, color: PALETTE.textPrimary, marginBottom: SPACING.sm },
  message: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 21, color: PALETTE.textSecondary, marginBottom: SPACING.lg },
  actions: { flexDirection: 'row', gap: SPACING.md },
});
