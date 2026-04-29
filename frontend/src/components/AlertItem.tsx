import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Alert } from "../data/types";
import { useApp } from "../context/AppContext";
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

function AlertIcon({ color }: { color: string }) {
  return (
    <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
      <Circle cx={11.5} cy={11.5} r={10.5} stroke={color} strokeWidth={1.5} />
      <Path d="M11.5 7v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={11.5} cy={15.5} r={0.75} fill={color} stroke={color} strokeWidth={0.5} />
    </Svg>
  );
}

interface AlertItemProps {
  alert: Alert;
  onPress?: () => void;
}

const severityStyles: Record<Alert["severity"], { bg: string; iconColor: string; timeColor: string }> = {
  critical: {
    bg: "#f7e2db",
    iconColor: "#d40101",
    timeColor: "rgba(43,41,35,0.25)",
  },
  warning: {
    bg: "#fff3dc",
    iconColor: "#e7a000",
    timeColor: "rgba(43,41,35,0.25)",
  },
};

export default function AlertItem({ alert, onPress }: AlertItemProps) {
  const { horses } = useApp();
  const horse = horses.find((h) => h.id === alert.horseId);
  const horseName = horse?.name ?? "Unknown";
  const timeAgo = formatRelativeTime(alert.timestamp);
  const sv = severityStyles[alert.severity];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: sv.bg }]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <AlertIcon color={sv.iconColor} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.horseName}>{horseName}</Text>
          <Text style={[styles.timeAgo, { color: sv.timeColor }]}>{timeAgo}</Text>
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {alert.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  body: {
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  horseName: {
    ...type.calloutBold,
    color: "#2b2923",
  },
  timeAgo: {
    ...type.caption1,
    flexShrink: 0,
  },
  message: {
    ...type.callout,
    color: "rgba(43,41,35,0.75)",
  },
});
