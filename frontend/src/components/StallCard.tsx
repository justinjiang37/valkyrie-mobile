import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
<<<<<<< Updated upstream
import { Stall, Horse, HealthScore } from "../data/types";
=======
import { Stall, Horse, HealthScore, getStatusColor, toFiveScale } from "../data/types";
>>>>>>> Stashed changes
import { Colors } from "../constants/theme";
import { type } from "../constants/typography";
import { StatusTag } from "./StatusTag";
import { CameraFeedCard } from "./CameraFeedCard";

interface StallCardProps {
  stall: Stall;
  horse: Horse;
  score: HealthScore;
  videoOffset?: number;
}

export default function StallCard({ stall, horse, score, videoOffset = 0 }: StallCardProps) {
  const router = useRouter();
  const isOffline = stall.cameraStatus === "offline";
<<<<<<< Updated upstream
=======
  const statusColor = getStatusColor(score.status);
>>>>>>> Stashed changes

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/stall/${stall.id}`)}
    >
<<<<<<< Updated upstream
      {/* Header row: Stall # + Horse Name | StatusTag */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {stall.name} • {horse.name}
        </Text>
        <StatusTag status={score.status} />
=======
      {/* Video / placeholder */}
      <View style={styles.videoContainer}>
        {isOffline ? (
          <View style={styles.offlinePlaceholder}>
            <Feather name="video-off" size={32} color={Colors.textTertiary} />
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
          <Text style={styles.scoreText}>{toFiveScale(score.overall)}/5</Text>
        </View>
>>>>>>> Stashed changes
      </View>

      {/* Camera feed */}
      <CameraFeedCard
        stallLabel={`${stall.name} • Live Feed`}
        videoOffset={videoOffset}
        isOffline={isOffline}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
});
