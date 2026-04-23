import React from "react";
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../src/context/AppContext";
import { horses, stalls } from "../../src/data/mock";
import { Colors } from "../../src/constants/theme";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { scores, settings } = useApp();

  const onlineCameras = stalls.filter((s) => s.cameraStatus === "online").length;
  const criticalCount = Object.values(scores).filter((s) => s.status === "critical").length;
  const avgScore = Math.round(
    Object.values(scores).reduce((sum, s) => sum + s.overall, 0) / Object.values(scores).length
  ) || 0;

  const paranoiaLabels: Record<number, string> = {
    1: "Relaxed", 2: "Moderate", 3: "Standard", 4: "Vigilant", 5: "Maximum",
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Profile</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Farm card */}
        <View style={styles.card}>
          <View style={styles.farmHeader}>
            <View style={styles.farmIcon}>
              <Feather name="home" size={28} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.farmName}>{settings.farmName}</Text>
              <Text style={styles.farmOwner}>{settings.ownerName}</Text>
            </View>
          </View>
          <View style={styles.fields}>
            <Field label="Email" value={settings.email} />
            <Field label="Phone" value={settings.phone} />
            <Field label="Vet Phone" value={settings.vetPhone} />
            <Field
              label="Paranoia Level"
              value={`${settings.paranoiaLevel}/5 — ${paranoiaLabels[settings.paranoiaLevel]}`}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farm Overview</Text>
          <View style={styles.statsGrid}>
            <Stat label="Horses" value={horses.length} />
            <Stat label="Stalls" value={stalls.length} />
            <Stat label="Online Cams" value={`${onlineCameras}/${stalls.length}`} />
            <Stat label="Avg Score" value={avgScore} />
            <Stat label="Critical" value={criticalCount} highlight={criticalCount > 0} />
            <Stat label="Alert Threshold" value={80 - (settings.paranoiaLevel - 1) * 10} />
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Links</Text>
          <QuickLink label="Edit Farm Settings" icon="settings" onPress={() => router.push("/(tabs)/settings")} />
          <QuickLink label="View Active Alerts" icon="bell" onPress={() => router.push("/(tabs)/alerts")} />
          <QuickLink label="Activity History" icon="clock" onPress={() => router.push("/(tabs)/activity")} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: Colors.critical }]}>{value}</Text>
    </View>
  );
}

function QuickLink({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickLink} activeOpacity={0.7} onPress={onPress}>
      <Feather name={icon as any} size={18} color={Colors.textSecondary} />
      <Text style={styles.quickLinkText}>{label}</Text>
      <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: 28, fontWeight: "800", color: Colors.textPrimary,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  scroll: { paddingHorizontal: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 1px 3px rgba(0,0,0,0.04)" }
      : {}),
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 },
  farmHeader: { flexDirection: "row", alignItems: "center", columnGap: 14, marginBottom: 18 },
  farmIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center",
  },
  farmName: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  farmOwner: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  fields: { rowGap: 10 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between" },
  fieldLabel: { fontSize: 13, color: Colors.textTertiary },
  fieldValue: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 10 },
  stat: {
    width: "47%" as any, backgroundColor: Colors.background,
    borderRadius: 10, padding: 12,
    ...(Platform.OS === "web"
      ? { flexBasis: "calc(50% - 5px)" as any, width: "auto" as any }
      : {}),
  },
  statLabel: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.textPrimary },
  quickLink: {
    flexDirection: "row", alignItems: "center", columnGap: 12,
    backgroundColor: Colors.background, borderRadius: 10, padding: 14, marginBottom: 8,
  },
  quickLinkText: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
});
