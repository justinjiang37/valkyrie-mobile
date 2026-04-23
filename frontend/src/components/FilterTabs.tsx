import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/theme";

interface Tab<T extends string> {
  label: string;
  value: T;
  count: number;
}

interface FilterTabsProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (value: T) => void;
}

export default function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: FilterTabsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <TouchableOpacity
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>
              ({tab.count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    columnGap: 4,
    backgroundColor: "#f0ebe3",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  tabCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  tabCountActive: {
    color: Colors.textSecondary,
  },
});
