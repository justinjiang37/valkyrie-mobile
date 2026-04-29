import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Line, Path, Circle } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import { StatusTag } from "../../src/components/StatusTag";
import { FilterSheet, type AlertFilters } from "../../src/components/FilterSheet";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";

type TabId = "active" | "info" | "resolved";

function CriticalIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke="rgba(43,41,35,0.5)" strokeWidth="1.5" />
      <Path d="M10 6v5" stroke="rgba(43,41,35,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="10" cy="14" r="0.75" fill="rgba(43,41,35,0.5)" />
    </Svg>
  );
}

function WarningIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 3L18.66 17.5H1.34L10 3Z"
        stroke="rgba(43,41,35,0.5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path d="M10 9v4" stroke="rgba(43,41,35,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="10" cy="14.5" r="0.75" fill="rgba(43,41,35,0.5)" />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M4 10h12M12 6l4 4-4 4" stroke={Colors.textPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
      <Line x1={0} y1={1.5} x2={16} y2={1.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={3} y1={6} x2={13} y2={6} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5} y1={10.5} x2={11} y2={10.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function WatchLevelCard() {
  const router = useRouter();
  return (
    <View style={styles.watchCard}>
      <View style={styles.watchCardContent}>
        <Text style={styles.watchCardTitle}>Set your watch level</Text>
        <Text style={styles.watchCardBody}>
          Tell us how closely to monitor each horse. Higher levels mean higher sensitivity to changes: helpful during recovery, travel stress, or seasonal changes.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.watchCardButton}
        onPress={() => router.push("/(tabs)/profile")}
        activeOpacity={0.8}
      >
        <Text style={styles.watchCardButtonText}>Manage in Profile</Text>
        <ArrowRightIcon />
      </TouchableOpacity>
    </View>
  );
}

function SectionHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function AlertRow({
  horseName,
  horseImageUrl,
  timeAgo,
  message,
  status,
  isUnread,
  showDivider,
  onPress,
}: {
  horseName: string;
  horseImageUrl: string;
  timeAgo: string;
  message: string;
  status: "healthy" | "warning" | "critical" | "info";
  isUnread: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity style={styles.alertRow} activeOpacity={0.96} onPress={onPress}>
        {horseImageUrl ? (
          <Image source={{ uri: horseImageUrl }} style={styles.horseAvatar} />
        ) : (
          <View style={[styles.horseAvatar, styles.horseAvatarPlaceholder]} />
        )}
        <View style={styles.alertContent}>
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
        </View>
      </TouchableOpacity>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function SectionDivider() {
  return <View style={styles.sectionDivider} />;
}

export default function AlertsScreen() {
  const { alerts, horses, stalls } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AlertFilters>({
    urgency: new Set(),
    horseIds: new Set(),
    date: null,
  });

  const markRead = (id: string) => setReadIds((prev) => new Set([...prev, id]));

  const criticalAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "warning");

  const resolvedAlerts = alerts.filter((a) => {
    if (a.status !== "resolved") return false;
    if (filters.urgency.size > 0 && !filters.urgency.has(a.severity)) return false;
    if (filters.horseIds.size > 0 && !filters.horseIds.has(a.horseId)) return false;
    if (filters.date) {
      const alertDate = new Date(a.timestamp);
      const f = filters.date;
      if (
        alertDate.getFullYear() !== f.getFullYear() ||
        alertDate.getMonth() !== f.getMonth() ||
        alertDate.getDate() !== f.getDate()
      ) return false;
    }
    return true;
  });

  const hasActiveFilters =
    filters.urgency.size > 0 || filters.horseIds.size > 0 || filters.date !== null;

  const formatTimeAgo = (timestamp: string): string => {
    const diffMin = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const handleAlertPress = (alertItem: typeof alerts[0]) => {
    markRead(alertItem.id);
    const stall = stalls.find((s) => s.id === alertItem.stallId);
    if (stall) router.push(`/stall/${stall.id}`);
  };

  const getHorse = (horseId: string) => horses.find((h) => h.id === horseId);

  const activeCount = criticalAlerts.length + warningAlerts.length;
  const infoCount = 0;

  const tabs = [
    { id: "active" as TabId, label: `Active (${activeCount})` },
    { id: "info" as TabId, label: `Info (${infoCount})` },
    { id: "resolved" as TabId, label: "Resolved" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
                  <TouchableOpacity onPress={() => setFilterOpen(true)} hitSlop={8} style={styles.filterIconWrap}>
                    <FilterIcon />
                    {hasActiveFilters && <View style={styles.filterDot} />}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          <WatchLevelCard />

          {activeTab === "active" && (
            <View style={styles.sectionsContainer}>
              <View style={styles.section}>
                <SectionHeader label="CRITICAL" icon={<CriticalIcon />} />
                {criticalAlerts.length > 0 ? (
                  <View style={styles.cardBg}>
                    {criticalAlerts.map((alert, index) => {
                      const horse = getHorse(alert.horseId);
                      return (
                        <AlertRow
                          key={alert.id}
                          horseName={horse?.name ?? "Unknown"}
                          horseImageUrl={horse?.imageUrl ?? ""}
                          timeAgo={formatTimeAgo(alert.timestamp)}
                          message={alert.message}
                          status="critical"
                          isUnread={!readIds.has(alert.id)}
                          showDivider={index < criticalAlerts.length - 1}
                          onPress={() => handleAlertPress(alert)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No critical alerts.</Text>
                )}
              </View>

              <SectionDivider />

              <View style={styles.section}>
                <SectionHeader label="WARNING" icon={<WarningIcon />} />
                {warningAlerts.length > 0 ? (
                  <View>
                    {warningAlerts.map((alert, index) => {
                      const horse = getHorse(alert.horseId);
                      return (
                        <AlertRow
                          key={alert.id}
                          horseName={horse?.name ?? "Unknown"}
                          horseImageUrl={horse?.imageUrl ?? ""}
                          timeAgo={formatTimeAgo(alert.timestamp)}
                          message={alert.message}
                          status="warning"
                          isUnread={!readIds.has(alert.id)}
                          showDivider={index < warningAlerts.length - 1}
                          onPress={() => handleAlertPress(alert)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No warning alerts.</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === "info" && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No info alerts.</Text>
            </View>
          )}

          {activeTab === "resolved" && (
            <View style={styles.sectionsContainer}>
              {resolvedAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {hasActiveFilters ? "No resolved alerts match your filters." : "No resolved alerts."}
                  </Text>
                </View>
              ) : (
                <View>
                  {resolvedAlerts.map((alert, index) => {
                    const horse = getHorse(alert.horseId);
                    return (
                      <AlertRow
                        key={alert.id}
                        horseName={horse?.name ?? "Unknown"}
                        horseImageUrl={horse?.imageUrl ?? ""}
                        timeAgo={formatTimeAgo(alert.timestamp)}
                        message={alert.message}
                        status="info"
                        isUnread={false}
                        showDivider={index < resolvedAlerts.length - 1}
                        onPress={() => handleAlertPress(alert)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        horses={horses}
        filters={filters}
        onApply={setFilters}
      />
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
    backgroundColor: "#efede4",
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
  scrollView: { flex: 1 },
  scrollContent: { gap: 24, paddingTop: 8 },

  // Watch level card
  watchCard: {
    backgroundColor: "#b0def0",
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
    gap: 24,
  },
  watchCardContent: { gap: 8, width: "70%" },
  watchCardTitle: {
    ...type.title3,
    color: Colors.textPrimary,
  },
  watchCardBody: {
    ...type.caption1,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  watchCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 33,
    height: 48,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  watchCardButtonText: {
    ...type.body,
    color: Colors.textPrimary,
  },

  // Sections
  sectionsContainer: { gap: 24 },
  section: { gap: 12, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    ...type.caption1,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  cardBg: {
    backgroundColor: "#efede4",
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },

  // Alert rows
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  horseAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  horseAvatarPlaceholder: {
    backgroundColor: Colors.cardBg,
  },
  alertContent: {
    flex: 1,
    gap: 8,
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

  // Empty states
  filterIconWrap: { position: "relative" },
  filterDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#bda632",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    ...type.callout,
    color: Colors.textQuaternary,
    paddingHorizontal: 16,
  },
});
