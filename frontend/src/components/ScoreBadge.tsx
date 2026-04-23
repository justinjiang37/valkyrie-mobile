import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getStatus, getStatusColor, toFiveScale } from "../data/types";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export default function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const bg = getStatusColor(getStatus(score));
  const text = `${toFiveScale(score)}/5`;

  if (size === "lg") {
    return (
      <View style={[styles.badgeLg, { backgroundColor: bg }]}>
        <Text style={styles.scoreLg}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.score}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  score: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  badgeLg: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scoreLg: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
});
