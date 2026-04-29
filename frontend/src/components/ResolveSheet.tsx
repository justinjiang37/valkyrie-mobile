import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke="#fbf9f0" strokeWidth="1.5" />
      <Path
        d="M6.5 10l2.5 2.5 4.5-5"
        stroke="#fbf9f0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatTimeAgo(timestamp: string): string {
  const diffMin = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
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

  return (
    <BottomSheet open={open} onClose={handleCancel}>
      <View style={styles.content}>
        {/* Alert preview */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALERT</Text>
          <View style={styles.alertPreview}>
            <View style={styles.alertRow}>
              <Text style={styles.horseName}>{horseName}</Text>
              <View style={styles.alertRight}>
                <Text style={styles.timeAgo}>{formatTimeAgo(alert.timestamp)}</Text>
                <StatusTag status={alert.severity === 'critical' ? 'critical' : 'warning'} />
              </View>
            </View>
            <Text style={styles.message} numberOfLines={3}>
              {alert.message}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
            {note.length === 0 && (
              <Text style={styles.placeholder} pointerEvents="none">
                e.g. Checked in with the vet
              </Text>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resolveBtn} activeOpacity={0.85} onPress={handleResolve}>
            <CheckCircleIcon />
            <Text style={styles.resolveBtnText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleCancel}>
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
    paddingBottom: 16,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  alertPreview: {
    gap: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 8,
  },
  timeAgo: {
    ...type.caption1,
    color: Colors.textFaint,
  },
  message: {
    ...type.callout,
    color: Colors.textTertiary,
  },
  inputWrap: {
    backgroundColor: '#efede4',
    borderRadius: 8,
    height: 106,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 13,
    paddingBottom: 13,
    ...type.callout,
    color: Colors.textPrimary,
    height: 106,
  },
  placeholder: {
    position: 'absolute',
    top: 13,
    left: 10,
    ...type.callout,
    fontStyle: 'italic',
    color: 'rgba(43,41,35,0.5)',
    pointerEvents: 'none',
  },
  actions: {
    gap: 12,
    paddingBottom: 4,
  },
  resolveBtn: {
    height: 48,
    backgroundColor: '#bda632',
    borderRadius: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  resolveBtnText: {
    ...type.callout,
    fontWeight: '500',
    color: '#fbf9f0',
  },
  cancelBtn: {
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...type.callout,
    fontWeight: '500',
    color: '#939189',
  },
});
