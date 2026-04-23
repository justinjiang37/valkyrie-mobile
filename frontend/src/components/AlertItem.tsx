import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Alert } from "../data/types";
import { horses } from "../data/mock";
import { Colors } from "../constants/theme";
import { type } from "../constants/typography";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface AlertItemProps {
  alert: Alert;
  onPress?: () => void;
}

// Dot icon component matching web design
function DotsIcon() {
  return (
    <View style={styles.dotsContainer}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  );
}

export default function AlertItem({ alert, onPress }: AlertItemProps) {
  const horse = horses.find((h) => h.id === alert.horseId);
  const horseName = horse?.name ?? "Unknown";
  const timeAgo = formatRelativeTime(alert.timestamp);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.94}
      onPress={onPress}
    >
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>ALERT</Text>
        <DotsIcon />
      </View>

      {/* Inner white card */}
      <View style={styles.innerCard}>
        <View style={styles.innerHeader}>
          <Text style={styles.horseName}>{horseName}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {alert.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textQuaternary,
  },
  innerCard: {
    backgroundColor: Colors.white,
    borderRadius: 7,
    paddingHorizontal: 19,
    paddingVertical: 14,
    gap: 8,
  },
  innerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  horseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  timeAgo: {
    ...type.caption1,
    color: Colors.textFaint,
    flexShrink: 0,
  },
  message: {
    ...type.callout,
    color: Colors.textSecondary,
  },
});
