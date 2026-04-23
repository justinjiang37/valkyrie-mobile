import React, { useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import AlertItem from "../../src/components/AlertItem";
import FilterTabs from "../../src/components/FilterTabs";
import { Colors } from "../../src/constants/theme";
import { Feather } from "@expo/vector-icons";

type FilterTab = "all" | "new" | "acknowledged" | "resolved";

export default function AlertsScreen() {
  const { alerts, acknowledgeAlert, resolveAlert } = useApp();
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.status === filter);
  const newCount = alerts.filter((a) => a.status === "new").length;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "all", count: alerts.length },
    { label: "New", value: "new", count: alerts.filter((a) => a.status === "new").length },
    { label: "Acknowledged", value: "acknowledged", count: alerts.filter((a) => a.status === "acknowledged").length },
    { label: "Resolved", value: "resolved", count: alerts.filter((a) => a.status === "resolved").length },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {newCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />
      </View>

      {filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AlertItem
              alert={item}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
            />
          )}
        />
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={36} color={Colors.healthy} />
          </View>
          <Text style={styles.emptyTitle}>No alerts</Text>
          <Text style={styles.emptyText}>All horses are healthy.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  badge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { color: Colors.critical, fontSize: 13, fontWeight: "700" },
  tabsContainer: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 100 },
  emptyIcon: { marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
