import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import { Stall, Horse, HealthScore } from "../data/types";
import { Colors } from "../constants/theme";
import { type } from "../constants/typography";
import { CameraFeedCard } from "./CameraFeedCard";

interface StallCardProps {
  stall: Stall;
  horse: Horse;
  score: HealthScore;
  videoOffset?: number;
}

// Camera icon matching Figma (video camera outline)
function CameraIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Rect x={1} y={4.5} width={13} height={11} rx={1.5} stroke="rgba(43,41,35,0.5)" strokeWidth={1.5} />
      <Path d="M14 8l5-2.5v9L14 12V8z" stroke="rgba(43,41,35,0.5)" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

// Signal bars icon — 3 horizontal bars of different widths, rotated 90° to look like signal strength
function SignalBars({ status }: { status: HealthScore["status"] }) {
  const key = status === "healthy" ? "healthy" : status === "critical" ? "critical" : "warning";
  const colors = Colors.statusBars[key];
  return (
    <View style={signalStyles.outer}>
      <View style={signalStyles.inner}>
        <View style={[signalStyles.bar, signalStyles.barFull, { backgroundColor: colors[2] }]} />
        <View style={[signalStyles.bar, signalStyles.barMid, { backgroundColor: colors[1] }]} />
        <View style={[signalStyles.bar, signalStyles.barShort, { backgroundColor: colors[0] }]} />
      </View>
    </View>
  );
}

const signalStyles = StyleSheet.create({
  outer: {
    width: 13,
    height: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    gap: 2,
    alignItems: "flex-end",
    justifyContent: "center",
    transform: [{ rotate: "90deg" }],
    width: 11,
  },
  bar: {
    height: 3,
    borderRadius: 0.5,
  },
  barFull: { width: 11 },
  barMid: { width: 8 },
  barShort: { width: 5 },
});

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const behaviorLabel: Record<HealthScore["status"], string> = {
  healthy: "Resting",
  watch: "Active",
  "at-risk": "Restless",
  critical: "Attention needed",
};

export default function StallCard({ stall, horse, score, videoOffset = 0 }: StallCardProps) {
  const router = useRouter();
  const isOffline = stall.cameraStatus === "offline";
  const timeAgo = formatRelativeTime(score.timestamp);
  const behavior = behaviorLabel[score.status];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/stall/${stall.id}`)}
    >
      {/* Video */}
      <CameraFeedCard
        videoUrl={horse.videoUrl}
        videoOffset={videoOffset}
        isOffline={isOffline}
        isLiveStream={horse.isLiveStream}
      />

      {/* Below-video info */}
      <View style={styles.meta}>
        {/* Horse name + signal bars */}
        <View style={styles.nameRow}>
          <Text style={styles.horseName}>{horse.name}</Text>
          <SignalBars status={score.status} />
        </View>

        {/* Subtitle: camera icon + stall • behavior • time */}
        <View style={styles.subtitleRow}>
          <CameraIcon />
          <Text style={styles.subtitle} numberOfLines={1}>
            {stall.name} • {behavior} • {timeAgo}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  meta: {
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  horseName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#2b2923",
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(43,41,35,0.5)",
    flexShrink: 1,
  },
});
