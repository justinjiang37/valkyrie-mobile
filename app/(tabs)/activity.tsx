import React, { useState, useMemo } from "react";
import { FlatList, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { annotations, horses, stalls } from "../../src/data/mock";
import FilterTabs from "../../src/components/FilterTabs";
import { Colors } from "../../src/constants/theme";
import { Feather } from "@expo/vector-icons";

type SeverityFilter = "all" | "info" | "warning" | "critical";

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  const diffHr = Math.floor(diffMin / 60);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const sevStyle: Record<string, { bg: string; text: string }> = {
  info: { bg: "#dbeafe", text: "#1d4ed8" },
  warning: { bg: "#fef9c3", text: "#a16207" },
  critical: { bg: "#fee2e2", text: "#b91c1c" },
};

const typeIcons: Record<string, string> = {
  movement: "trending-up",
  posture: "user",
  feeding: "droplet",
  activity: "zap",
};

function getAllActivities() {
  const all: Array<{
    id: string; stallId: string; stallName: string; horseName: string;
    timestamp: string; type: string; message: string; severity: string;
  }> = [];
  for (const [stallId, anns] of Object.entries(annotations)) {
    const stall = stalls.find((s) => s.id === stallId);
    const horse = horses.find((h) => h.stallId === stallId);
    for (const ann of anns) {
      all.push({ ...ann, stallName: stall?.name ?? "", horseName: horse?.name ?? "" });
    }
  }
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export default function ActivityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const activities = useMemo(getAllActivities, []);
  const filtered = filter === "all" ? activities : activities.filter((a) => a.severity === filter);

  const tabs: { label: string; value: SeverityFilter; count: number }[] = [
    { label: "All", value: "all", count: activities.length },
    { label: "Info", value: "info", count: activities.filter((a) => a.severity === "info").length },
    { label: "Warning", value: "warning", count: activities.filter((a) => a.severity === "warning").length },
    { label: "Critical", value: "critical", count: activities.filter((a) => a.severity === "critical").length },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Activity</Text>

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={[styles.stat, { backgroundColor: "#f0ebe3" }]}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{activities.length}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: "#fef9c3" }]}>
          <Text style={styles.statLabel}>Warnings</Text>
          <Text style={[styles.statValue, { color: "#a16207" }]}>
            {activities.filter((a) => a.severity === "warning").length}
          </Text>
        </View>
        <View style={[styles.stat, { backgroundColor: "#fee2e2" }]}>
          <Text style={styles.statLabel}>Critical</Text>
          <Text style={[styles.statValue, { color: Colors.critical }]}>
            {activities.filter((a) => a.severity === "critical").length}
          </Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`/stall/${item.stallId}`)}
          >
            <Feather
              name={(typeIcons[item.type] || "zap") as any}
              size={16}
              color={Colors.textTertiary}
              style={{ marginTop: 2 }}
            />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHorse}>{item.horseName}</Text>
                <Text style={styles.cardStall}>{item.stallName}</Text>
                <View style={[styles.sevBadge, { backgroundColor: sevStyle[item.severity]?.bg }]}>
                  <Text style={[styles.sevText, { color: sevStyle[item.severity]?.text }]}>
                    {item.severity}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
            </View>
            <Text style={styles.cardTime}>{formatRelativeTime(item.timestamp)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: 28, fontWeight: "800", color: Colors.textPrimary,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  statsRow: { flexDirection: "row", columnGap: 10, paddingHorizontal: 16, marginBottom: 16 },
  stat: { flex: 1, borderRadius: 12, padding: 12 },
  statLabel: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  tabsContainer: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16 },
  card: {
    flexDirection: "row", columnGap: 10, padding: 14,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", rowGap: 6, columnGap: 6, marginBottom: 4 },
  cardHorse: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  cardStall: { fontSize: 12, color: Colors.textTertiary },
  sevBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  sevText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  cardMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  cardTime: { fontSize: 11, color: Colors.textTertiary },
});
