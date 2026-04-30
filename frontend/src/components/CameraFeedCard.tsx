import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { type } from '../constants/typography';

interface CameraFeedCardProps {
  videoUrl?: string | null;
  videoOffset?: number;
  isOffline?: boolean;
  isLiveStream?: boolean; // Set to true for MJPEG streams
}

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = position === 'tl' || position === 'tr';
  const isLeft = position === 'tl' || position === 'bl';
  return (
    <View
      style={[
        styles.bracket,
        isTop ? styles.bracketTop : styles.bracketBottom,
        isLeft ? styles.bracketLeft : styles.bracketRight,
        {
          borderTopWidth: isTop ? 2 : 0,
          borderBottomWidth: isTop ? 0 : 2,
          borderLeftWidth: isLeft ? 2 : 0,
          borderRightWidth: isLeft ? 0 : 2,
        },
      ]}
    />
  );
}

export function CameraFeedCard({ videoUrl, videoOffset = 0, isOffline = false, isLiveStream = false }: CameraFeedCardProps) {
  const hasVideo = !isOffline && !!videoUrl;

  const renderVideoContent = () => {
    if (!hasVideo) {
      return (
        <View style={styles.offlineContent}>
          <Feather name="video-off" size={36} color="rgba(255,255,255,0.15)" />
        </View>
      );
    }

    // MJPEG streams use WebView (handles streaming natively)
    if (isLiveStream) {
      return (
        <WebView
          source={{ uri: videoUrl! }}
          style={styles.video}
          scrollEnabled={false}
          scalesPageToFit={true}
        />
      );
    }

    // Regular video files use expo-av Video component
    return (
      <Video
        source={{ uri: videoUrl! }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        positionMillis={videoOffset * 1000}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderVideoContent()}

      {/* LIVE • 30FPS badge — top right */}
      {hasVideo && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE • 30FPS</Text>
        </View>
      )}

      {/* Corner brackets */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />
    </View>
  );
}

const BRACKET_SIZE = 16;
const BRACKET_INSET = 8;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 230,
    backgroundColor: '#e1d9cf',
    borderRadius: 8,
    overflow: 'hidden',
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
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,249,240,0.25)',
    borderRadius: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    ...type.caption2Semibold,
    color: '#fbf9f0',
  },
  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  bracketTop: { top: BRACKET_INSET },
  bracketBottom: { bottom: BRACKET_INSET },
  bracketLeft: { left: BRACKET_INSET },
  bracketRight: { right: BRACKET_INSET },
});
