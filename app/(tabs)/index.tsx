import React from "react";
import { FlatList, Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { stalls, horses } from "../../src/data/mock";
import StallCard from "../../src/components/StallCard";
import { Colors } from "../../src/constants/theme";

export default function DashboardScreen() {
  const { scores } = useApp();

  const data = stalls.map((stall, index) => {
    const horse = horses.find((h) => h.stallId === stall.id);
    const score = scores[stall.id];
    return { stall, horse, score, index };
  }).filter((d) => d.horse && d.score);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Dashboard</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.stall.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StallCard
            stall={item.stall}
            horse={item.horse!}
            score={item.score!}
            videoOffset={item.index * 3.7 + item.index * 1.3}
          />
        )}
        ListHeaderComponent={<View style={{ height: 4 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  list: { paddingHorizontal: 16 },
});
