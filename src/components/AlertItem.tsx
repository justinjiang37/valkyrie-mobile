import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { Alert } from "../data/types";
import { horses } from "../data/mock";
import { Colors } from "../constants/theme";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (id: string, note?: string) => void;
  onResolve: (id: string) => void;
}

const severityColors = {
  warning: { bg: "#fef9c3", text: "#a16207" },
  critical: { bg: "#fee2e2", text: "#b91c1c" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "#dbeafe", text: "#1d4ed8" },
  acknowledged: { bg: "#fef3c7", text: "#b45309" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
};

export default function AlertItem({ alert, onAcknowledge, onResolve }: AlertItemProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");

  const horse = horses.find((h) => h.id === alert.horseId);
  const horseName = horse?.name ?? "Unknown";
  const sev = severityColors[alert.severity];
  const stat = statusColors[alert.status];

  const handleAcknowledge = () => {
    if (!showNoteInput) {
      setShowNoteInput(true);
      return;
    }
    onAcknowledge(alert.id, note || undefined);
    setShowNoteInput(false);
    setNote("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: alert.severity === "critical" ? Colors.critical : Colors.watch },
          ]}
        />
        <View style={styles.content}>
          <View style={styles.badges}>
            <Text style={styles.horseName}>{horseName}</Text>
            <View style={[styles.badge, { backgroundColor: sev.bg }]}>
              <Text style={[styles.badgeText, { color: sev.text }]}>{alert.severity}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: stat.bg }]}>
              <Text style={[styles.badgeText, { color: stat.text }]}>{alert.status}</Text>
            </View>
            <Text style={styles.time}>{formatRelativeTime(alert.timestamp)}</Text>
          </View>

          <Text style={styles.message}>{alert.message}</Text>

          {alert.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                <Text style={{ fontWeight: "600" }}>Note: </Text>
                {alert.note}
              </Text>
            </View>
          )}

          {showNoteInput && (
            <View style={styles.noteInputRow}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)..."
                placeholderTextColor={Colors.textTertiary}
                style={styles.noteInput}
                onSubmitEditing={handleAcknowledge}
                autoFocus
              />
              <TouchableOpacity onPress={handleAcknowledge} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowNoteInput(false); setNote(""); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actions}>
            {alert.status === "new" && !showNoteInput && (
              <TouchableOpacity onPress={handleAcknowledge} style={styles.ackBtn}>
                <Text style={styles.ackBtnText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
            {alert.status === "acknowledged" && (
              <TouchableOpacity onPress={() => onResolve(alert.id)} style={styles.resolveBtn}>
                <Text style={styles.resolveBtnText}>Resolve</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 10,
  },
  row: { flexDirection: "row", columnGap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  content: { flex: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", rowGap: 6, columnGap: 6, marginBottom: 6 },
  horseName: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  time: { fontSize: 12, color: Colors.textTertiary },
  message: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  noteBox: { backgroundColor: Colors.background, borderRadius: 8, padding: 10, marginBottom: 8 },
  noteText: { fontSize: 12, color: Colors.textSecondary },
  noteInputRow: { flexDirection: "row", columnGap: 8, marginBottom: 8 },
  noteInput: {
    flex: 1, fontSize: 14, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface, color: Colors.textPrimary,
  },
  submitBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cancelBtn: { backgroundColor: "#e7e1d9", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, justifyContent: "center" },
  cancelBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", columnGap: 8 },
  ackBtn: { backgroundColor: Colors.accentLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  ackBtnText: { color: Colors.accent, fontSize: 13, fontWeight: "600" },
  resolveBtn: { backgroundColor: "#dcfce7", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  resolveBtnText: { color: "#15803d", fontSize: 13, fontWeight: "600" },
});
