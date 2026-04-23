import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import { Stall, Horse, HealthScore, getStatusColor, getStatusLabel } from "../data/types";
import { Colors } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

interface StallCardProps {
  stall: Stall;
  horse: Horse;
  score: HealthScore;
  videoOffset?: number;
}

export default function StallCard({ stall, horse, score, videoOffset = 0 }: StallCardProps) {
  const router = useRouter();
  const isOffline = stall.cameraStatus === "offline";
  const statusColor = getStatusColor(score.status);
  const statusLabel = getStatusLabel(score.status);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/stall/${stall.id}`)}
    >
      {/* Video / placeholder */}
      <View style={styles.videoContainer}>
        {isOffline ? (
          <View style={styles.offlinePlaceholder}>
            <Feather name="video-off" size={32} color={Colors.textTertiary} />
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

        {/* LIVE badge */}
        {!isOffline && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Score badge */}
        <View style={[styles.scoreBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.scoreText}>{score.overall}</Text>
          <Text style={styles.scoreLabel}>{statusLabel}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.horseName} numberOfLines={1}>{horse.name}</Text>
          <Text style={styles.stallName}>{stall.name}</Text>
        </View>
        <Text style={styles.breed}>{horse.breed} · {horse.age} yrs</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden" as const,
    marginBottom: 14,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 3px rgba(0,0,0,0.04)" }
      : {}),
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: "#e7e1d9",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  video: { width: "100%", height: "100%" },
  offlinePlaceholder: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    rowGap: 6,
  },
  offlineText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500" as const,
  },
  liveBadge: {
    position: "absolute" as const,
    top: 10,
    left: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    columnGap: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.critical,
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  scoreBadge: {
    position: "absolute" as const,
    top: 10,
    right: 10,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    columnGap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scoreText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800" as const,
  },
  scoreLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600" as const,
  },
  info: { padding: 14 },
  infoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  horseName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    flex: 1,
  },
  stallName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  breed: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
});
