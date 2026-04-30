import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet, Dimensions, Linking, Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { WebView } from "react-native-webview";
import { LineChart } from "react-native-chart-kit";
import { useApp } from "../../src/context/AppContext";
import { annotations } from "../../src/data/mock";
import { supabase } from "../../src/lib/supabase";
import { StatusTag } from "../../src/components/StatusTag";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";
import { Feather } from "@expo/vector-icons";
import { ResolveSheet } from "../../src/components/ResolveSheet";

const screenWidth = Dimensions.get("window").width;

const ALERT_PINK = "#f7e2db";
const ALERT_ORANGE = "#e24d17";
const ALERT_ORANGE_BORDER = "rgba(226,77,23,0.5)";
const CALL_GOLD = "#bda632";

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

function CornerBracket({ top, left, right, bottom }: {
  top?: boolean; left?: boolean; right?: boolean; bottom?: boolean;
}) {
  return (
    <View style={{
      width: 22,
      height: 22,
      borderTopWidth: top ? 2 : 0,
      borderBottomWidth: bottom ? 2 : 0,
      borderLeftWidth: left ? 2 : 0,
      borderRightWidth: right ? 2 : 0,
      borderColor: "rgba(255,255,255,0.6)",
    }} />
  );
}

export default function StallDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { scores, settings, alerts, horses, stalls, resolveAlert } = useApp();

  const stall = stalls.find((s) => s.id === id);
  const horse = horses.find((h) => h.stallId === id);
  const score = scores[id!];
  const stallAnnotations = annotations[id!] || [];
  const [history, setHistory] = useState<{ timestamp: string; overall: number }[]>([]);
  const [resolveSheetOpen, setResolveSheetOpen] = useState(false);
  const isOffline = stall?.cameraStatus === "offline";

  const handleResolve = useCallback(
    (alertId: string, note: string) => {
      resolveAlert(alertId, note || undefined);
    },
    [resolveAlert]
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("health_scores")
        .select("timestamp, overall")
        .eq("stall_id", id)
        .order("timestamp", { ascending: true })
        .limit(48);
      if (!cancelled && data) setHistory(data as { timestamp: string; overall: number }[]);
    })();
    return () => { cancelled = true; };
  }, [id, score?.timestamp]);

  const stallIndex = stalls.findIndex((s) => s.id === id);
  const videoOffset = stallIndex * 3.7 + stallIndex * 1.3;

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

  const chartValues = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 48 }, (_, i) => {
      const bucketStart = now - (47 - i + 1) * 3600000;
      const bucketEnd = now - (47 - i) * 3600000;
      const row = history.find((r) => {
        const t = new Date(r.timestamp).getTime();
        return t >= bucketStart && t < bucketEnd;
      });
      return row ? Math.round((row.overall - 10) / 20 + 1) : 1;
    });
  }, [history]);

  const chartLabels = ["48h", "36h", "24h", "12h", "6h", "Now"];
  const isCritical = stallAlert?.severity === "critical";
  const vetPhone = settings?.vetPhone ?? "+16507136140";

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      {/* Alert card */}
      {stallAlert && (
        <View style={styles.alertCard}>
          <Feather name="alert-circle" size={28} color={ALERT_ORANGE} />
          <Text style={styles.alertMessageText}>
            {stallAlert.message}{"  "}
            <Text style={styles.alertTimestamp}>{formatRelativeTime(stallAlert.timestamp)}</Text>
          </Text>
          <View style={styles.alertActions}>
            <View style={styles.alertSecondaryRow}>
              <TouchableOpacity
                style={styles.outlineBtn}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`tel:${vetPhone}`)}
              >
                <Feather name="phone-call" size={16} color={ALERT_ORANGE} />
                <Text style={styles.outlineBtnText}>Call Dr. Jun</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlineBtn}
                activeOpacity={0.8}
                onPress={() => setResolveSheetOpen(true)}
              >
                <Text style={styles.outlineBtnText}>Mark as Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Horse detail section */}
      <View style={styles.horseSection}>
        {/* Header row */}
        <View style={styles.horseHeader}>
          {horse.imageUrl ? (
            <Image source={{ uri: horse.imageUrl }} style={styles.horseAvatar} />
          ) : (
            <View style={[styles.horseAvatar, styles.horseAvatarFallback]} />
          )}
          <View style={styles.horseHeaderInfo}>
            <Text style={styles.stallLabel}>{stall.name.toUpperCase()}</Text>
            <View style={styles.horseNameRow}>
              <Text style={styles.horseName}>{horse.name}</Text>
              <Feather name="chevron-up" size={20} color={Colors.textPrimary} />
            </View>
          </View>
        </View>

        {/* Video */}
        <View>
          <View style={styles.videoContainer}>
            {isOffline || !horse.videoUrl ? (
              <View style={styles.offlinePlaceholder}>
                <Feather name="video-off" size={40} color="rgba(255,255,255,0.07)" />
              </View>
            ) : horse.isLiveStream ? (
              <WebView
                source={{ uri: horse.videoUrl }}
                style={styles.video}
                scrollEnabled={false}
                scalesPageToFit={true}
              />
            ) : (
              <Video
                source={{ uri: horse.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
                positionMillis={videoOffset * 1000}
              />
            )}
            <View style={[styles.corner, styles.cornerTL]}>
              <CornerBracket top left />
            </View>
            <View style={[styles.corner, styles.cornerTR]}>
              <CornerBracket top right />
            </View>
            <View style={[styles.corner, styles.cornerBL]}>
              <CornerBracket bottom left />
            </View>
            <View style={[styles.corner, styles.cornerBR]}>
              <CornerBracket bottom right />
            </View>
            {!isOffline && horse.videoUrl && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE • 30FPS</Text>
              </View>
            )}
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOffline ? "#9d9a8d" : "#22c55e" }]} />
            <Text style={styles.statusText}>{isOffline ? "Offline" : "Online"}</Text>
          </View>
        </View>

        {/* Call vet CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.callVetBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(`tel:${vetPhone}`)}
          >
            <Feather name="phone-call" size={17} color="#fbf9f0" />
            <Text style={styles.callVetText}>Call Dr. Jun</Text>
          </TouchableOpacity>
          {isCritical && (
            <Text style={styles.recommendedText}>RECOMMENDED: Critical risk</Text>
          )}
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderGroup}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          <Text style={styles.sectionSubLabel}>Status over last 48 data points</Text>
        </View>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues, color: () => Colors.textPrimary, strokeWidth: 2 }],
          }}
          width={screenWidth - 32}
          height={170}
          yAxisSuffix="/5"
          yAxisInterval={1}
          fromZero={false}
          chartConfig={{
            backgroundColor: Colors.background,
            backgroundGradientFrom: Colors.background,
            backgroundGradientTo: Colors.background,
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

      {/* Behavioral Annotations */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BEHAVIORAL ANNOTATIONS</Text>
        <View>
          {stallAnnotations.length > 0 ? (
            stallAnnotations.map((ann, index) => {
              const isFirst = index === 0;
              const isLast = index === stallAnnotations.length - 1;
              const annStatus = ann.severity === "critical" ? "critical"
                : ann.severity === "warning" ? "warning"
                : "info";
              return (
                <React.Fragment key={ann.id}>
                  <View style={[styles.annotationRow, isFirst && styles.annotationCardBg]}>
                    <View style={styles.annHeader}>
                      <Text style={styles.annHorse}>{horse.name}</Text>
                      <View style={styles.annMeta}>
                        <Text style={styles.annTime}>{formatRelativeTime(ann.timestamp)}</Text>
                        <StatusTag status={annStatus} />
                      </View>
                    </View>
                    <Text style={styles.annMessage}>{ann.message}</Text>
                  </View>
                  {!isLast && <View style={styles.annotationDivider} />}
                </React.Fragment>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No annotations recorded.</Text>
          )}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    <ResolveSheet
      open={resolveSheetOpen}
      onClose={() => setResolveSheetOpen(false)}
      alert={stallAlert ?? null}
      onResolve={handleResolve}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 20, gap: 32 },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { ...type.body, color: Colors.textTertiary },

  backButton: {
    width: 36,
    height: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  // Alert card
  alertCard: {
    backgroundColor: ALERT_PINK,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  alertMessageText: {
    ...type.callout,
    fontWeight: "500",
    color: "rgba(43,41,35,0.75)",
  },
  alertTimestamp: {
    ...type.caption1,
    color: "rgba(43,41,35,0.25)",
  },
  alertActions: { gap: 12 },
  viewFootageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    backgroundColor: ALERT_ORANGE,
    borderRadius: 47,
  },
  viewFootageText: {
    ...type.callout,
    fontWeight: "500",
    color: "#fbf9f0",
  },
  alertSecondaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderWidth: 1,
    borderColor: ALERT_ORANGE_BORDER,
    borderRadius: 83,
    backgroundColor: ALERT_PINK,
  },
  outlineBtnText: {
    ...type.callout,
    fontWeight: "500",
    color: ALERT_ORANGE,
  },

  // Horse section
  horseSection: { gap: 24 },
  horseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  horseAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  horseAvatarFallback: {
    backgroundColor: Colors.border,
  },
  horseHeaderInfo: { flex: 1 },
  stallLabel: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
  },
  horseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  horseName: {
    fontSize: 24,
    fontWeight: "500",
    color: "#2b2923",
    lineHeight: 28,
  },

  // Video
  videoContainer: {
    height: 230,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.videoBg,
  },
  video: { width: "100%", height: "100%" },
  offlinePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: { position: "absolute", padding: 6 },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  liveBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,249,240,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 34,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" },
  liveText: { ...type.caption2Semibold, color: "#fbf9f0" },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { ...type.callout, color: Colors.textPrimary },

  // CTA
  ctaSection: { gap: 8, alignItems: "center" },
  callVetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    width: "100%",
    backgroundColor: CALL_GOLD,
    borderRadius: 47,
  },
  callVetText: {
    ...type.callout,
    fontWeight: "500",
    color: "#fbf9f0",
  },
  recommendedText: {
    ...type.caption1Medium,
    color: ALERT_ORANGE,
    textAlign: "center",
  },

  // Sections
  section: { gap: 12 },
  sectionHeaderGroup: { gap: 4 },
  sectionLabel: { ...type.caption1Medium, color: Colors.textTertiary },
  sectionSubLabel: { ...type.caption1, color: Colors.textTertiary },

  // Annotations
  annotationRow: {
    paddingVertical: 12,
    gap: 5,
  },
  annotationCardBg: {
    backgroundColor: ALERT_PINK,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  annotationDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  annHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  annHorse: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  annMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  annTime: {
    ...type.caption1,
    color: Colors.textFaint,
    textAlign: "right",
  },
  annMessage: { ...type.callout, color: Colors.textSecondary },
  emptyText: {
    ...type.callout,
    color: Colors.textQuaternary,
    textAlign: "center",
    paddingVertical: 24,
  },
});
