import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Line } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import { StatusTag } from "../../src/components/StatusTag";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";

type TabId = "active" | "info" | "resolved";

// Section dot component
function SectionDot({ color }: { color: string }) {
  return <View style={[styles.sectionDot, { backgroundColor: color }]} />;
}


// Filter icon for Resolved tab
function FilterIcon() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
      <Line x1={0} y1={1.5} x2={16} y2={1.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={3} y1={6} x2={13} y2={6} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5} y1={10.5} x2={11} y2={10.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

// Section header component
function SectionHeader({
  label,
  dotColor,
}: {
  label: string;
  dotColor?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {dotColor && <SectionDot color={dotColor} />}
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>
    </View>
  );
}

// Alert row component
function AlertRow({
  horseName,
  timeAgo,
  message,
  status,
  isUnread,
  showDivider,
  onPress,
}: {
  horseName: string;
  timeAgo: string;
  message: string;
  status: "healthy" | "warning" | "critical" | "info";
  isUnread: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.alertRow, showDivider && styles.alertRowDivider]}
      activeOpacity={0.96}
      onPress={onPress}
    >
      <View style={styles.alertRowHeader}>
        <Text style={styles.alertHorseName}>{horseName}</Text>
        <View style={styles.alertRowRight}>
          <Text style={styles.alertTimeAgo}>{timeAgo}</Text>
          <StatusTag status={status} />
        </View>
      </View>
      <Text
        style={isUnread ? styles.alertMessageUnread : styles.alertMessageRead}
        numberOfLines={2}
      >
        {message}
      </Text>
    </TouchableOpacity>
  );
}

// Section divider
function SectionDivider() {
  return <View style={styles.sectionDivider} />;
}

export default function AlertsScreen() {
  const { alerts, horses, stalls } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  // Categorize alerts
  const criticalAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "warning");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  // Format relative time
  const formatTimeAgo = (timestamp: string): string => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMin = Math.floor((now - then) / 60000);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const handleAlertPress = (alertItem: typeof alerts[0]) => {
    markRead(alertItem.id);
    const stall = stalls.find((s) => s.id === alertItem.stallId);
    if (stall) {
      router.push(`/stall/${stall.id}`);
    }
  };

  const getHorseName = (horseId: string) => {
    return horses.find((h) => h.id === horseId)?.name ?? "Unknown";
  };

  const activeCount = criticalAlerts.length + warningAlerts.length;

  const tabs = [
    { id: "active" as TabId, label: `Active (${activeCount})` },
    { id: "info" as TabId, label: "Info (0)" },
    { id: "resolved" as TabId, label: "Resolved" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header + tab pills */}
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.tabPillContainer}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, isSelected && styles.tabPillSelected]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabPillText, isSelected && styles.tabPillTextSelected]}>
                  {tab.label}
                </Text>
                {tab.id === "resolved" && isSelected && (
                  <View style={styles.filterIconWrapper}>
                    <FilterIcon />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active tab content */}
        {activeTab === "active" && (
          <View style={styles.sectionsContainer}>
            {/* Critical section */}
            <View style={styles.section}>
              <SectionHeader label="CRITICAL" dotColor="#E72A00" />
              {criticalAlerts.length > 0 && (
                <View style={styles.cardBg}>
                  {criticalAlerts.map((alert, index) => (
                    <AlertRow
                      key={alert.id}
                      horseName={getHorseName(alert.horseId)}
                      timeAgo={formatTimeAgo(alert.timestamp)}
                      message={alert.message}
                      status="critical"
                      isUnread={!readIds.has(alert.id)}
                      showDivider={index < criticalAlerts.length - 1}
                      onPress={() => handleAlertPress(alert)}
                    />
                  ))}
                </View>
              )}
            </View>

            <SectionDivider />

            {/* Warning section */}
            <View style={styles.section}>
              <SectionHeader label="WARNING" dotColor="#E7C000" />
              {warningAlerts.length > 0 && (
                <View style={styles.warningList}>
                  {warningAlerts.map((alert, index) => (
                    <AlertRow
                      key={alert.id}
                      horseName={getHorseName(alert.horseId)}
                      timeAgo={formatTimeAgo(alert.timestamp)}
                      message={alert.message}
                      status="warning"
                      isUnread={!readIds.has(alert.id)}
                      showDivider={index < warningAlerts.length - 1}
                      onPress={() => handleAlertPress(alert)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Info tab - empty for now */}
        {activeTab === "info" && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No info alerts.</Text>
          </View>
        )}

        {/* Resolved tab */}
        {activeTab === "resolved" && (
          <View style={styles.sectionsContainer}>
            {resolvedAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No resolved alerts.</Text>
              </View>
            ) : (
              resolvedAlerts.map((alert, index) => (
                <TouchableOpacity
                  key={alert.id}
                  style={[
                    styles.resolvedRow,
                    index < resolvedAlerts.length - 1 && styles.alertRowDivider,
                  ]}
                  activeOpacity={0.96}
                  onPress={() => handleAlertPress(alert)}
                >
                  <View style={styles.alertRowHeader}>
                    <Text style={styles.alertHorseName}>{getHorseName(alert.horseId)}</Text>
                    <Text style={styles.alertTimeAgo}>{formatTimeAgo(alert.timestamp)}</Text>
                  </View>
                  <Text style={styles.alertMessageRead} numberOfLines={2}>
                    {alert.message}
                  </Text>
                  {alert.note && (
                    <View style={styles.resolutionNote}>
                      <Text style={styles.resolutionNoteText}>{alert.note}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    ...type.header,
    color: Colors.textPrimary,
  },
  tabPillContainer: {
    flexDirection: "row",
    backgroundColor: Colors.cardBg,
    borderRadius: 999,
    padding: 3,
    height: 35,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
  },
  tabPillSelected: {
    backgroundColor: Colors.white,
  },
  tabPillText: {
    ...type.caption1,
    color: Colors.textTertiary,
  },
  tabPillTextSelected: {
    color: Colors.textPrimary,
  },
  filterIconWrapper: {
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  sectionsContainer: {
    gap: 24,
    paddingTop: 8,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  sectionLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  cardBg: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 8,
  },
  warningList: {
    paddingHorizontal: 16,
  },
  alertRow: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
  },
  alertRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  alertRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  alertHorseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  alertTimeAgo: {
    ...type.caption1,
    color: Colors.textFaint,
  },
  alertMessageRead: {
    ...type.callout,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  alertMessageUnread: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },
  resolvedRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  resolutionNote: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resolutionNoteText: {
    ...type.callout,
    fontStyle: "italic",
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    ...type.callout,
    color: Colors.textQuaternary,
  },
});
