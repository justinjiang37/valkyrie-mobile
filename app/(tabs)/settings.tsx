import React, { useState } from "react";
import {
  ScrollView, Text, View, TextInput, Switch, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { FarmSettings } from "../../src/data/types";
import { Colors } from "../../src/constants/theme";
import { Feather } from "@expo/vector-icons";

const paranoiaLabels: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Relaxed", desc: "Only critical events (threshold: 80)", color: Colors.healthy },
  2: { label: "Moderate", desc: "Elevated and critical (threshold: 70)", color: Colors.watch },
  3: { label: "Standard", desc: "Balanced sensitivity (threshold: 60)", color: Colors.atRisk },
  4: { label: "Vigilant", desc: "Early warning enabled (threshold: 50)", color: Colors.atRisk },
  5: { label: "Maximum", desc: "Alert on any concern (threshold: 40)", color: Colors.critical },
};

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const [form, setForm] = useState<FarmSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof FarmSettings, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const pInfo = paranoiaLabels[form.paranoiaLevel];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Farm info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farm Information</Text>
          <InputField label="Farm Name" value={form.farmName} onChange={(v) => handleChange("farmName", v)} />
          <InputField label="Owner Name" value={form.ownerName} onChange={(v) => handleChange("ownerName", v)} />
          <InputField label="Phone" value={form.phone} onChange={(v) => handleChange("phone", v)} keyboardType="phone-pad" />
          <InputField label="Email" value={form.email} onChange={(v) => handleChange("email", v)} keyboardType="email-address" />
        </View>

        {/* Vet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veterinary Contact</Text>
          <InputField label="Vet Phone" value={form.vetPhone} onChange={(v) => handleChange("vetPhone", v)} keyboardType="phone-pad" />
          <Text style={styles.note}>Used for the Call Vet quick action on stall detail pages</Text>
        </View>

        {/* Paranoia scale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Sensitivity</Text>
          <View style={styles.paranoiaHeader}>
            <Text style={styles.paranoiaLabel}>Paranoia Level</Text>
            <Text style={styles.paranoiaValue}>{form.paranoiaLevel}/5 — {pInfo.label}</Text>
          </View>
          <View style={styles.paranoiaDots}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => handleChange("paranoiaLevel", n)}
                style={[
                  styles.paranoiaDot,
                  {
                    backgroundColor: n === form.paranoiaLevel ? paranoiaLabels[n].color : "#f0ebe3",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.paranoiaDotText,
                    { color: n === form.paranoiaLevel ? "#fff" : Colors.textTertiary },
                  ]}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.paranoiaDesc}>{pInfo.desc}</Text>
          <Text style={styles.note}>
            Higher paranoia means earlier alerts. Set this based on how closely you want to monitor your horses.
          </Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Alert Notifications</Text>
              <Text style={styles.toggleDesc}>Show notifications when a horse's risk score spikes</Text>
            </View>
            <Switch
              value={form.alertNotifications}
              onValueChange={(v) => handleChange("alertNotifications", v)}
              trackColor={{ false: "#d4cbbe", true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.toggleRow, { opacity: 0.5 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Alert Sound</Text>
              <Text style={styles.toggleDesc}>Coming soon</Text>
            </View>
            <Switch
              value={form.alertSound}
              onValueChange={() => {}}
              disabled
              trackColor={{ false: "#d4cbbe", true: Colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
        {saved && (
          <View style={styles.savedRow}>
            <Feather name="check-circle" size={16} color={Colors.healthy} />
            <Text style={styles.savedText}>Settings saved</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InputField({
  label, value, onChange, keyboardType = "default",
}: {
  label: string; value: string; onChange: (v: string) => void; keyboardType?: TextInput["props"]["keyboardType"];
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.fieldInput}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: 28, fontWeight: "800", color: Colors.textPrimary,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  scroll: { paddingHorizontal: 16 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 18, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary, marginBottom: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 },
  fieldInput: {
    fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  note: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  paranoiaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  paranoiaLabel: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  paranoiaValue: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  paranoiaDots: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  paranoiaDot: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  paranoiaDotText: { fontSize: 16, fontWeight: "800" },
  paranoiaDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10, columnGap: 12,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: Colors.textPrimary },
  toggleDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 12,
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", columnGap: 6, marginTop: 12 },
  savedText: { color: Colors.healthy, fontSize: 14, fontWeight: "600" },
});
