import React, { useState } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet, Dimensions, Linking, Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { LineChart } from "react-native-chart-kit";
import { useApp } from "../../src/context/AppContext";
import { stalls, horses, annotations, timelines } from "../../src/data/mock";
import { getStatusColor } from "../../src/data/types";
import ScoreBadge from "../../src/components/ScoreBadge";
import ScoreBar from "../../src/components/ScoreBar";
import { Colors } from "../../src/constants/theme";
import { Feather } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

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

export default function StallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { scores, settings, markStallChecked, checkedStalls } = useApp();
  const [justChecked, setJustChecked] = useState(false);

  const stall = stalls.find((s) => s.id === id);
  const horse = horses.find((h) => h.stallId === id);
  const score = scores[id!];
  const stallAnnotations = annotations[id!] || [];
  const timeline = timelines[id!] || [];
  const isOffline = stall?.cameraStatus === "offline";
  const stallIndex = stalls.findIndex((s) => s.id === id);
  const videoOffset = stallIndex * 3.7 + stallIndex * 1.3;

  if (!stall || !horse || !score) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Stall not found.</Text>
      </View>
    );
  }

  const handleMarkChecked = () => {
    markStallChecked(id!);
    setJustChecked(true);
    setTimeout(() => setJustChecked(false), 3000);
  };

  const checkedAt = checkedStalls[id!];

  // Prepare chart data - sample every 4th point for readability
  const chartLabels = timeline.filter((_, i) => i % 8 === 0).map((_, i) => `${48 - i * 8}h`);
  const chartValues = timeline;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Video */}
      <View style={styles.videoContainer}>
        {isOffline ? (
          <View style={styles.offlinePlaceholder}>
            <Feather name="video-off" size={40} color={Colors.textTertiary} />
            <Text style={styles.offlineText}>Camera Offline</Text>
          </View>
        ) : (
          <Video
            source={require("../../assets/sample-stall.mp4")}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            positionMillis={videoOffset * 1000}
          />
        )}
        {!isOffline && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <View style={styles.videoLabel}>
          <Text style={styles.videoLabelText}>{stall.name} · Live Feed</Text>
        </View>
      </View>

      {/* Horse profile */}
      <View style={styles.card}>
        <Text style={styles.horseName}>{horse.name}</Text>
        <View style={styles.profileRows}>
          <ProfileRow label="Breed" value={horse.breed} />
          <ProfileRow label="Age" value={`${horse.age} years`} />
          <ProfileRow label="Stall" value={stall.name} />
          <ProfileRow label="Camera" value={isOffline ? "Offline" : "Online"} />
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.callVetBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(`tel:${settings.vetPhone.replace(/[^0-9+]/g, "")}`)}
        >
          <Feather name="phone" size={18} color={Colors.critical} />
          <Text style={styles.callVetText}>Call Vet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.checkBtn, justChecked && { opacity: 0.6 }]}
          activeOpacity={0.8}
          onPress={handleMarkChecked}
          disabled={justChecked}
        >
          <Feather name="check-circle" size={18} color={Colors.healthy} />
          <Text style={styles.checkText}>{justChecked ? "Checked" : "Mark Checked"}</Text>
        </TouchableOpacity>
      </View>
      {checkedAt && !justChecked && (
        <Text style={styles.checkedAt}>Last checked: {formatRelativeTime(checkedAt)}</Text>
      )}

      {/* Health score */}
      <View style={styles.card}>
        <View style={styles.scoreHeader}>
          <Text style={styles.cardTitle}>Health Score</Text>
          <ScoreBadge score={score.overall} size="lg" />
        </View>
        <ScoreBar label="Movement" value={score.movement} />
        <ScoreBar label="Posture" value={score.posture} />
        <ScoreBar label="Feeding" value={score.feeding} />
        <ScoreBar label="Activity" value={score.activity} />
      </View>

      {/* Timeline chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>48-Hour Timeline</Text>
        <Text style={styles.cardSubtitle}>Risk score over last 48 data points</Text>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues, color: () => getStatusColor(score.status), strokeWidth: 2 }],
          }}
          width={screenWidth - 72}
          height={200}
          yAxisSuffix=""
          yAxisInterval={1}
          fromZero
          chartConfig={{
            backgroundColor: Colors.surface,
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            decimalPlaces: 0,
            color: () => Colors.border,
            labelColor: () => Colors.textTertiary,
            propsForDots: { r: "0" },
            propsForBackgroundLines: { stroke: Colors.border, strokeDasharray: "4,4" },
          }}
          style={{ marginLeft: -8, borderRadius: 10 }}
          bezier
          withDots={false}
        />
        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color={Colors.healthy} label="Healthy (0-29)" />
          <LegendItem color={Colors.watch} label="Watch (30-59)" />
          <LegendItem color={Colors.atRisk} label="At Risk (60-79)" />
          <LegendItem color={Colors.critical} label="Critical (80-100)" />
        </View>
      </View>

      {/* Annotations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Behavioral Annotations{" "}
          <Text style={styles.annotationCount}>({stallAnnotations.length})</Text>
        </Text>
        {stallAnnotations.length > 0 ? (
          stallAnnotations.map((ann) => {
            const sev = sevStyle[ann.severity] || sevStyle.info;
            return (
              <View key={ann.id} style={styles.annotation}>
                <View style={styles.annHeader}>
                  <Text style={styles.annType}>{ann.type}</Text>
                  <View style={[styles.annBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[styles.annBadgeText, { color: sev.text }]}>{ann.severity}</Text>
                  </View>
                  <Text style={styles.annTime}>{formatRelativeTime(ann.timestamp)}</Text>
                </View>
                <Text style={styles.annMessage}>{ann.message}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No annotations recorded.</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { fontSize: 16, color: Colors.textSecondary },

  videoContainer: {
    aspectRatio: 16 / 9, borderRadius: 14, overflow: "hidden" as const,
    backgroundColor: "#e7e1d9", marginBottom: 14, position: "relative" as const,
  },
  video: { width: "100%", height: "100%" },
  offlinePlaceholder: { flex: 1, justifyContent: "center" as const, alignItems: "center" as const, rowGap: 6 },
  offlineText: { fontSize: 13, color: Colors.textTertiary, fontWeight: "500" },
  liveBadge: {
    position: "absolute" as const, top: 12, left: 12, flexDirection: "row" as const, alignItems: "center" as const,
    columnGap: 5, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.critical },
  liveText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  videoLabel: { position: "absolute", bottom: 12, left: 12 },
  videoLabelText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },

  card: {
    backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, padding: 18, marginBottom: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 3px rgba(0,0,0,0.04)" }
      : {}),
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },

  horseName: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },
  profileRows: { rowGap: 8 },
  profileRow: { flexDirection: "row", justifyContent: "space-between" },
  profileLabel: { fontSize: 14, color: Colors.textSecondary },
  profileValue: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },

  actionsRow: { flexDirection: "row", columnGap: 10, marginBottom: 8 },
  callVetBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fca5a5",
  },
  callVetText: { fontSize: 15, fontWeight: "700", color: Colors.critical },
  checkBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 8,
    paddingVertical: 14, borderRadius: 12, backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac",
  },
  checkText: { fontSize: 15, fontWeight: "700", color: "#15803d" },
  checkedAt: { fontSize: 12, color: Colors.textTertiary, textAlign: "center", marginBottom: 14 },

  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },

  legend: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", columnGap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, color: Colors.textSecondary },

  annotationCount: { fontWeight: "400", color: Colors.textTertiary, fontSize: 13 },
  annotation: {
    backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginTop: 8,
  },
  annHeader: { flexDirection: "row", alignItems: "center", columnGap: 6, marginBottom: 4 },
  annType: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, textTransform: "capitalize" },
  annBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  annBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  annTime: { fontSize: 11, color: Colors.textTertiary, marginLeft: "auto" },
  annMessage: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  emptyText: { fontSize: 14, color: Colors.textTertiary, textAlign: "center", paddingVertical: 24 },
});
