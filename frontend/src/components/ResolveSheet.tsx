import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { StatusTag } from './StatusTag';
import { Colors } from '../constants/theme';
import { type } from '../constants/typography';
import { Alert } from '../data/types';
import { useApp } from '../context/AppContext';

interface ResolveSheetProps {
  open: boolean;
  onClose: () => void;
  alert: Alert | null;
  onResolve: (alertId: string, note: string) => void;
}

export function ResolveSheet({ open, onClose, alert, onResolve }: ResolveSheetProps) {
  const [note, setNote] = useState('');
  const { horses } = useApp();

  if (!alert) return null;

  const horse = horses.find((h) => h.id === alert.horseId);
  const horseName = horse?.name ?? 'Unknown';

  const handleResolve = () => {
    onResolve(alert.id, note);
    setNote('');
    onClose();
  };

  const handleCancel = () => {
    setNote('');
    onClose();
  };

  // Format relative time
  const formatTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.content}>
        {/* Alert preview */}
        <View style={styles.alertPreview}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertLabel}>ALERT</Text>
            <View style={styles.dots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
          <View style={styles.alertCard}>
            <View style={styles.alertCardHeader}>
              <Text style={styles.horseName}>{horseName}</Text>
              <View style={styles.alertRight}>
                <Text style={styles.timeAgo}>{formatTimeAgo(alert.timestamp)}</Text>
                <StatusTag status={alert.severity === 'critical' ? 'critical' : 'warning'} />
              </View>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {alert.message}
            </Text>
          </View>
        </View>

        {/* Notes input */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note about resolution..."
            placeholderTextColor={Colors.textQuaternary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.resolveBtn}
            activeOpacity={0.8}
            onPress={handleResolve}
          >
            <Text style={styles.resolveBtnText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  alertPreview: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textQuaternary,
  },
  alertCard: {
    backgroundColor: Colors.white,
    borderRadius: 7,
    paddingHorizontal: 19,
    paddingVertical: 14,
    gap: 8,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  horseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  alertRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timeAgo: {
    ...type.caption1,
    color: Colors.textFaint,
  },
  message: {
    ...type.callout,
    color: Colors.textSecondary,
  },
  notesSection: {
    gap: 8,
  },
  notesLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  notesInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    padding: 16,
    minHeight: 80,
    ...type.body,
    color: Colors.textPrimary,
  },
  actions: {
    gap: 8,
    paddingBottom: 16,
  },
  resolveBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 999,
  },
  resolveBtnText: {
    ...type.callout,
    color: '#FFFDF0',
  },
  cancelBtn: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...type.callout,
    color: Colors.textQuaternary,
  },
});
