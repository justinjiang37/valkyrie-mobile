import React, { useState } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet, Dimensions, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { LineChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import { stalls, horses, annotations, timelines } from "../../src/data/mock";
import { StatusTag } from "../../src/components/StatusTag";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";
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


export default function StallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { scores, settings, markStallChecked, checkedStalls, alerts } = useApp();
  const [justChecked, setJustChecked] = useState(false);

  const stall = stalls.find((s) => s.id === id);
  const horse = horses.find((h) => h.stallId === id);
  const score = scores[id!];
  const stallAnnotations = annotations[id!] || [];
  const timeline = timelines[id!] || [];
  const isOffline = stall?.cameraStatus === "offline";
  const stallIndex = stalls.findIndex((s) => s.id === id);
  const videoOffset = stallIndex * 3.7 + stallIndex * 1.3;

  // Get first active alert for this stall
  const stallAlert = alerts.find(
    (a) => a.stallId === id && a.status !== "resolved"
  );

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
<<<<<<< Updated upstream
      {/* Back navigation */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={Colors.textPrimary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
=======
      {/* Video */}
      <View style={styles.videoContainer}>
        {isOffline ? (
          <View style={styles.offlinePlaceholder}>
            <Feather name="video-off" size={40} color={Colors.textTertiary} />
            <Text style={styles.offlineText}>Camera Offline</Text>
          </View>
        ) : (
          <Video
            source={
              horse.name === "Bella"
                ? require("../../assets/horse-rolling17.mov")
                : require("../../assets/sample-stall.mp4")
            }
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            positionMillis={horse.name === "Bella" ? 0 : videoOffset * 1000}
>>>>>>> Stashed changes
          />
        </Svg>
      </TouchableOpacity>

      {/* Alert card (if there's an active alert) */}
      {stallAlert && (
        <View style={styles.alertCard}>
          <View style={styles.alertCardInner}>
            <View style={styles.alertCardHeader}>
              <Text style={styles.alertHorseName}>{horse.name}</Text>
              <StatusTag status={stallAlert.severity === "critical" ? "critical" : "warning"} />
            </View>
            <Text style={styles.alertMessage} numberOfLines={2}>
              {stallAlert.message}
            </Text>
          </View>
          <View style={styles.alertActions}>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${settings.vetPhone.replace(/[^0-9+]/g, "")}`)}
            >
              <Text style={styles.primaryBtnText}>Call Vet</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stall & Horse Info section */}
      <View style={styles.infoSection}>
        <Text style={styles.stallLabel}>{stall.name}</Text>
        <Text style={styles.horseName}>{horse.name}</Text>

        {/* Video */}
        <View style={styles.videoContainer}>
          {isOffline ? (
            <View style={styles.offlinePlaceholder}>
              <Feather name="video-off" size={40} color="rgba(255,255,255,0.07)" />
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
        </View>

        {/* Info rows */}
        <View style={styles.infoRows}>
          <InfoRow label="Breed" value={horse.breed} />
          <InfoRow label="Age" value={`${horse.age} years`} />
          <InfoRow label="Camera" value={isOffline ? "Offline" : "Online"} />
        </View>

        {/* Call Vet button */}
        <TouchableOpacity
          style={styles.callVetFullBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(`tel:${settings.vetPhone.replace(/[^0-9+]/g, "")}`)}
        >
          <Text style={styles.callVetFullText}>Call Vet</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TIMELINE</Text>
        <View style={styles.timelineCard}>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartValues, color: () => Colors.textPrimary, strokeWidth: 2 }],
            }}
            width={screenWidth - 72}
            height={170}
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero
            chartConfig={{
              backgroundColor: Colors.white,
              backgroundGradientFrom: Colors.white,
              backgroundGradientTo: Colors.white,
              decimalPlaces: 0,
              color: () => Colors.border,
              labelColor: () => Colors.textTertiary,
              propsForDots: { r: "0" },
              propsForBackgroundLines: { stroke: Colors.border, strokeDasharray: "4,4" },
            }}
            style={{ marginLeft: -8, borderRadius: 8 }}
            bezier
            withDots={false}
          />
        </View>
      </View>

      {/* Behavioral annotations */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BEHAVIORAL ANNOTATIONS</Text>
        {stallAnnotations.length > 0 ? (
          stallAnnotations.map((ann, index) => (
            <View
              key={ann.id}
              style={[
                styles.annotationRow,
                index < stallAnnotations.length - 1 && styles.annotationDivider,
              ]}
            >
              <View style={styles.annHeader}>
                <Text style={styles.annHorse}>{horse.name}</Text>
                <Text style={styles.annTime}>{formatRelativeTime(ann.timestamp)}</Text>
              </View>
              <Text style={styles.annMessage} numberOfLines={2}>
                {ann.message}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No annotations recorded.</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { ...type.body, color: Colors.textSecondary },

  // Back button
  backButton: {
    paddingTop: 16,
    paddingBottom: 12,
    width: 44,
  },

  // Alert card
  alertCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  alertCardInner: {
    backgroundColor: Colors.white,
    borderRadius: 7,
    paddingHorizontal: 19,
    paddingVertical: 14,
    gap: 8,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertHorseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  alertMessage: {
    ...type.callout,
    color: Colors.textSecondary,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 999,
  },
  secondaryBtnText: {
    ...type.callout,
    color: Colors.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: 999,
  },
  primaryBtnText: {
    ...type.callout,
    color: "#FFFDF0",
  },

  // Info section
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  stallLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  horseName: {
    ...type.title1,
    color: Colors.textPrimary,
  },

  // Video
  videoContainer: {
    height: 192,
    borderRadius: 8,
    overflow: "hidden" as const,
    backgroundColor: Colors.videoBg,
    position: "relative" as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  video: { width: "100%", height: "100%" },
  offlinePlaceholder: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  liveBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" },
  liveText: { ...type.caption2Semibold, color: Colors.white },

  // Info rows
  infoRows: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...type.callout,
    color: Colors.textTertiary,
  },
  infoValue: {
    ...type.callout,
    color: Colors.textPrimary,
  },

  // Call vet button
  callVetFullBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: 999,
    marginTop: 16,
  },
  callVetFullText: {
    ...type.callout,
    color: "#FFFDF0",
  },

  // Sections
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    paddingHorizontal: 0,
  },
  timelineCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
  },

  // Annotations
  annotationRow: {
    paddingVertical: 14,
    gap: 8,
  },
  annotationDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  annHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  annHorse: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  annTime: {
    ...type.caption1,
    color: Colors.textFaint,
  },
  annMessage: {
    ...type.callout,
    color: Colors.textSecondary,
  },
  emptyText: {
    ...type.callout,
    color: Colors.textQuaternary,
    textAlign: "center",
    paddingVertical: 24,
  },
});
