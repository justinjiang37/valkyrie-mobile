import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStatus, getStatusColor, getStatusLabel } from "../data/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export default function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const status = getStatus(score);
  const bg = getStatusColor(status);
  const label = getStatusLabel(status);

  if (size === "lg") {
    return (
      <View style={[styles.badgeLg, { backgroundColor: bg }]}>
        <Text style={styles.scoreLg}>{score}</Text>
        <Text style={styles.labelLg}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  score: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  label: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
  badgeLg: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scoreLg: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  labelLg: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 15,
  },
});
