import React from "react";
import { FlatList, Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import StallCard from "../../src/components/StallCard";
import AlertItem from "../../src/components/AlertItem";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";

// Spark logo matching web design
function SparkLogo() {
  return (
    <Svg width={23} height={27} viewBox="0 0 23 27" fill="black">
      <Path d="M11.314 0 L13.5 10 L23 11.314 L13.5 13.5 L11.314 27 L9.192 13.5 L0 11.314 L9.192 10 Z" />
    </Svg>
  );
}

export default function FeedsScreen() {
  const { scores, alerts, horses, stalls } = useApp();
  const router = useRouter();

  // Get the first critical or warning alert
  const featuredAlert = alerts.find(
    (a) => a.status === "new" && (a.severity === "critical" || a.severity === "warning")
  );

  const data = stalls.map((stall, index) => {
    const horse = horses.find((h) => h.stallId === stall.id);
    const score = scores[stall.id];
    return { stall, horse, score, index };
  }).filter((d) => d.horse && d.score);

  const handleAlertPress = () => {
    if (featuredAlert) {
      const stall = stalls.find((s) => s.id === featuredAlert.stallId);
      if (stall) {
        router.push(`/stall/${stall.id}`);
      }
    }
  };

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
            <Text style={styles.title}>Feeds</Text>
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
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    ...type.header,
    color: Colors.textPrimary,
  },
  list: { paddingHorizontal: 16 },
  cardWrapper: {
    marginBottom: 24,
  },
});
