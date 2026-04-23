import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Stall, Horse, HealthScore } from "../data/types";
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

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/stall/${stall.id}`)}
    >
      {/* Header row: Stall # + Horse Name | StatusTag */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {stall.name} • {horse.name}
        </Text>
        <StatusTag status={score.status} />
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
