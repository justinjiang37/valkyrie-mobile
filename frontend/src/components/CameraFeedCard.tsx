import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { type } from '../constants/typography';

interface CameraFeedCardProps {
  stallLabel: string;
  videoUrl?: string | null;
  videoOffset?: number;
  isOffline?: boolean;
}

export function CameraFeedCard({ stallLabel, videoUrl, videoOffset = 0, isOffline = false }: CameraFeedCardProps) {
  const hasVideo = !isOffline && !!videoUrl;
  return (
    <View style={styles.container}>
      {!hasVideo ? (
        <View style={styles.offlineContent}>
          <Feather name="video-off" size={36} color="rgba(255,255,255,0.07)" />
        </View>
      ) : (
        <>
          <Video
            source={{ uri: videoUrl! }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            positionMillis={videoOffset * 1000}
          />
          {/* Center camera icon overlay (subtle) */}
          <View style={styles.centerIcon}>
            <Feather name="video" size={36} color="rgba(255,255,255,0.07)" />
          </View>
        </>
      )}

      {/* LIVE badge */}
      {hasVideo && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Bottom label with gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)']}
        style={styles.bottomGradient}
      >
        <Text style={styles.stallLabel}>{stallLabel}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 192,
    backgroundColor: Colors.videoBg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  offlineContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    ...type.caption2Semibold,
    color: Colors.white,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 20,
  },
  stallLabel: {
    ...type.caption1,
    color: 'rgba(255,255,255,0.85)',
  },
});
