import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../src/context/AppContext";
import { useAuth } from "../../src/context/AuthContext";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";
import { Feather } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { scores, settings, horses, stalls, updateSettings } = useApp();
  const { user, logout, isLoading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Draft state for editing
  const [draft, setDraft] = useState({
    farmName: settings.farmName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    vetPhone: settings.vetPhone,
    paranoiaLevel: settings.paranoiaLevel,
  });

  const handleEdit = () => {
    setDraft({
      farmName: settings.farmName,
      ownerName: settings.ownerName,
      email: settings.email,
      phone: settings.phone,
      vetPhone: settings.vetPhone,
      paranoiaLevel: settings.paranoiaLevel,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(draft);
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User account card */}
        <View style={styles.card}>
          <View style={styles.farmHeader}>
            <View style={styles.userIcon}>
              <Feather name="user" size={28} color={Colors.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.farmName}>{user?.name || "Guest"}</Text>
              <Text style={styles.farmOwner}>{user?.email || "Not signed in"}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={Colors.critical.text} />
            ) : (
              <>
                <Feather name="log-out" size={18} color={Colors.critical.text} />
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Farm card */}
        <View style={styles.card}>
          <View style={styles.farmHeaderRow}>
            <View style={styles.farmHeader}>
              <View style={styles.farmIcon}>
                <Feather name="home" size={28} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.editInput}
                      value={draft.farmName}
                      onChangeText={(text) => setDraft({ ...draft, farmName: text })}
                      placeholder="Farm Name"
                      placeholderTextColor={Colors.textTertiary}
                    />
                    <TextInput
                      style={[styles.editInput, { marginTop: 8 }]}
                      value={draft.ownerName}
                      onChangeText={(text) => setDraft({ ...draft, ownerName: text })}
                      placeholder="Owner Name"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.farmName}>{settings.farmName}</Text>
                    <Text style={styles.farmOwner}>{settings.ownerName}</Text>
                  </>
                )}
              </View>
            </View>
            {!isEditing && (
              <TouchableOpacity onPress={handleEdit} style={styles.editBtn} activeOpacity={0.7}>
                <Feather name="edit-2" size={18} color={Colors.accent} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.fields}>
            {isEditing ? (
              <>
                <EditableField
                  label="Email"
                  value={draft.email}
                  onChangeText={(text) => setDraft({ ...draft, email: text })}
                  keyboardType="email-address"
                />
                <EditableField
                  label="Phone"
                  value={draft.phone}
                  onChangeText={(text) => setDraft({ ...draft, phone: text })}
                  keyboardType="phone-pad"
                />
                <EditableField
                  label="Vet Phone"
                  value={draft.vetPhone}
                  onChangeText={(text) => setDraft({ ...draft, vetPhone: text })}
                  keyboardType="phone-pad"
                />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Paranoia Level</Text>
                  <View style={styles.paranoiaSelector}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.paranoiaBtn,
                          draft.paranoiaLevel === level && styles.paranoidBtnActive,
                        ]}
                        onPress={() => setDraft({ ...draft, paranoiaLevel: level })}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.paranoiaBtnText,
                            draft.paranoiaLevel === level && styles.paranoiaBtnTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Field label="Email" value={settings.email} />
                <Field label="Phone" value={settings.phone} />
                <Field label="Vet Phone" value={settings.vetPhone} />
                <Field
                  label="Paranoia Level"
                  value={`${settings.paranoiaLevel}/5 — ${paranoiaLabels[settings.paranoiaLevel]}`}
                />
              </>
            )}
          </View>
          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFDF0" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
          <QuickLink label="View Active Alerts" icon="bell" onPress={() => router.push("/(tabs)/alerts")} />
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

function EditableField({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: Colors.critical.text }]}>{value}</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    ...type.header,
    color: Colors.textPrimary,
  },
  scroll: { paddingHorizontal: 16 },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    ...type.caption1Medium,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  farmHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  farmHeader: { flexDirection: "row", alignItems: "center", columnGap: 14, flex: 1 },
  farmIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center",
  },
  userIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.critical.bg,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutBtnText: {
    ...type.callout,
    fontWeight: "600",
    color: Colors.critical.text,
  },
  farmName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  farmOwner: {
    ...type.callout,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    padding: 8,
    marginLeft: 8,
  },
  editInput: {
    ...type.headline,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fields: { rowGap: 10 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldLabel: {
    ...type.callout,
    color: Colors.textTertiary,
  },
  fieldValue: {
    ...type.callout,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  fieldInput: {
    ...type.callout,
    fontWeight: "600",
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 150,
    textAlign: "right",
  },
  paranoiaSelector: {
    flexDirection: "row",
    gap: 6,
  },
  paranoiaBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  paranoidBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  paranoiaBtnText: {
    ...type.callout,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  paranoiaBtnTextActive: {
    color: "#FFFDF0",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  cancelBtnText: {
    ...type.callout,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    ...type.callout,
    fontWeight: "600",
    color: "#FFFDF0",
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 10 },
  stat: {
    width: "47%" as any,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
  },
  statLabel: {
    ...type.caption1,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  statValue: {
    ...type.title2,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickLink: {
    flexDirection: "row", alignItems: "center", columnGap: 12,
    backgroundColor: Colors.white, borderRadius: 8, padding: 14, marginBottom: 8,
  },
  quickLinkText: {
    flex: 1,
    ...type.callout,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
