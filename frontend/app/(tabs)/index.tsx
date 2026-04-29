import React, { useState } from "react";
import { FlatList, Text, StyleSheet, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, G } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import StallCard from "../../src/components/StallCard";
import AlertItem from "../../src/components/AlertItem";
import { Colors } from "../../src/constants/theme";

function SparkLogo() {
  return (
    <Svg width={23} height={27} viewBox="0 0 23 27" fill="black">
      <Path d="M11.314 0 L13.5 10 L23 11.314 L13.5 13.5 L11.314 27 L9.192 13.5 L0 11.314 L9.192 10 Z" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={9} cy={9} r={6} stroke="#9d9a8d" strokeWidth={1.5} />
      <Path d="M13.5 13.5L17.5 17.5" stroke="#9d9a8d" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function SunIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={2.5} fill="rgba(43,41,35,0.5)" />
      <G stroke="rgba(43,41,35,0.5)" strokeWidth={1.2} strokeLinecap="round">
        <Path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
      </G>
    </Svg>
  );
}

function formatHeaderDate(): string {
  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export default function FeedsScreen() {
  const { scores, alerts, horses, stalls, settings } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const featuredAlert = alerts.find(
    (a) => a.status === "new" && (a.severity === "critical" || a.severity === "warning")
  );

  const data = stalls
    .map((stall, index) => {
      const horse = horses.find((h) => h.stallId === stall.id);
      const score = scores[stall.id];
      return { stall, horse, score, index };
    })
    .filter((d) => d.horse && d.score);

  const handleAlertPress = () => {
    if (featuredAlert) {
      const stall = stalls.find((s) => s.id === featuredAlert.stallId);
      if (stall) {
        router.push(`/stall/${stall.id}`);
      }
    }
  };

  const barnLabel = settings?.farmName
    ? settings.farmName.toUpperCase()
    : "BARN";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.stall.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <SparkLogo />
            <Text style={styles.title}>
              <Text style={styles.titleLive}>Live </Text>
              Feeds
            </Text>
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Search horse or stall"
                placeholderTextColor="#9d9a8d"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.barnRow}>
              <Text style={styles.barnLabel}>{barnLabel}</Text>
              <View style={styles.dateGroup}>
                <SunIcon />
                <Text style={styles.barnLabel}>{formatHeaderDate()}</Text>
              </View>
            </View>
            {featuredAlert && (
              <AlertItem alert={featuredAlert} onPress={handleAlertPress} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <StallCard
              stall={item.stall}
              horse={item.horse!}
              score={item.score!}
              videoOffset={item.index * 3.7 + item.index * 1.3}
            />
          </View>
        )}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "500",
    color: "#2b2923",
  },
  titleLive: {
    color: "#585752",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efede4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2b2923",
    padding: 0,
  },
  barnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 4,
  },
  barnLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(43,41,35,0.5)",
    letterSpacing: 0.48,
  },
  dateGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  list: { paddingHorizontal: 16 },
  cardWrapper: {
    marginBottom: 24,
  },
});
