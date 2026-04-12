import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

interface ScoreBarProps {
  label: string;
  value: number;
}

function getBarColor(v: number): string {
  if (v >= 80) return Colors.critical;
  if (v >= 60) return Colors.atRisk;
  if (v >= 30) return Colors.watch;
  return Colors.healthy;
}

export default function ScoreBar({ label, value }: ScoreBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${value}%`, backgroundColor: getBarColor(value) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "500", color: Colors.textSecondary },
  value: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f0ebe3",
    overflow: "hidden" as const,
  },
  fill: { height: "100%" as any, borderRadius: 4 },
});
