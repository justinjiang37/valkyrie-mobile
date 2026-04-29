import React, { useState, useCallback } from "react";
import {
  ScrollView, Text, View, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, LayoutChangeEvent, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../src/context/AppContext";
import { useAuth } from "../../src/context/AuthContext";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";
import { Feather } from "@expo/vector-icons";

type TabId = "account" | "barn";

// Behaviors shown under the slider per level
const LEVEL_BEHAVIORS: Record<number, string[]> = {
  5: ["Rolling"],
  4: ["Rolling", "Biting"],
  3: ["Rolling", "Biting", "Repeated lying/standing"],
  2: ["Rolling", "Biting", "Repeated lying/standing"],
  1: ["Rolling", "Biting", "Repeated lying/standing"],
};

// ── Watch level slider ────────────────────────────────────────────────────────

function WatchLevelSlider({
  level,
  onChange,
}: {
  level: number;
  onChange: (l: number) => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  // Dot centers are evenly distributed across the inner track
  const dotIndex = level - 1; // 0–4
  const dotCenter =
    containerWidth > 0
      ? (dotIndex / 4) * containerWidth
      : 0;

  const highlightW = 80;
  const highlightLeft = dotCenter - highlightW / 2;

  return (
    <View>
      <View style={styles.sliderContainer} onLayout={onLayout}>
        {/* Background highlight pill behind selected dot */}
        {containerWidth > 0 && (
          <View
            style={[
              styles.sliderHighlight,
              { left: Math.max(0, Math.min(highlightLeft, containerWidth - highlightW)) },
            ]}
          />
        )}
        {/* Dots */}
        <View style={styles.sliderTrack}>
          {[1, 2, 3, 4, 5].map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => onChange(l)}
              activeOpacity={0.7}
              style={styles.dotWrap}
            >
              <View
                style={[
                  styles.dot,
                  l === level && styles.dotSelected,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>LOW SENSITIVITY</Text>
        <Text style={styles.sliderLabel}>HIGH SENSITIVITY</Text>
      </View>

      {/* Alert behavior tags */}
      <View style={styles.behaviorRow}>
        {LEVEL_BEHAVIORS[level].map((b) => (
          <View key={b} style={styles.behaviorTag}>
            <Text style={styles.behaviorTagText}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.notifRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.notifRowContent}>
        <View style={styles.notifRowHeader}>
          <Feather name={icon} size={20} color={Colors.textPrimary} />
          <Text style={styles.notifRowTitle}>{title}</Text>
        </View>
        <Text style={styles.notifRowDesc}>{description}</Text>
      </View>
      {onPress && (
        <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { settings, updateSettings } = useApp();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [loggingOut, setLoggingOut] = useState(false);

  // Barn settings edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    farmName: settings.farmName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    vetPhone: settings.vetPhone,
  });

  const handleWatchLevel = useCallback(
    (level: number) => {
      updateSettings({ paranoiaLevel: level });
    },
    [updateSettings]
  );

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logout(); } finally { setLoggingOut(false); }
        },
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(draft);
      setIsEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (settings.ownerName || user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const tabs = [
    { id: "account" as TabId, label: "My Account" },
    { id: "barn" as TabId, label: "Barn Settings" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header + tab pill */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.tabPillContainer}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, selected && styles.tabPillSelected]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabPillText, selected && styles.tabPillTextSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === "account" && (
          <View style={styles.section}>
            {/* Profile card */}
            <View style={styles.profileCard}>
              {/* Avatar + info */}
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {settings.ownerName || user?.name || "Your Name"}
                  </Text>
                  {settings.phone ? (
                    <View style={styles.infoRow}>
                      <Feather name="phone" size={16} color="#939189" />
                      <Text style={styles.infoText}>{settings.phone}</Text>
                    </View>
                  ) : null}
                  {(settings.email || user?.email) ? (
                    <View style={styles.infoRow}>
                      <Feather name="mail" size={16} color="#939189" />
                      <Text style={styles.infoText}>{settings.email || user?.email}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Edit Profile button */}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => { setActiveTab("barn"); setIsEditing(true); }}
                activeOpacity={0.8}
              >
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Notifications */}
            <View style={styles.notifSection}>
              <Text style={styles.notifTitle}>Notifications</Text>

              <View style={styles.notifList}>
                <NotifRow
                  icon="moon"
                  title="Quiet hours"
                  description={
                    <Text style={styles.notifRowDesc}>
                      {"Automatically mute low-priority notifications during your set hours. "}
                      <Text style={styles.notifRowDescBold}>
                        Warning and Critical alerts will still go through.
                      </Text>
                    </Text>
                  }
                  onPress={() => {}}
                />

                <View style={styles.notifDivider} />

                <NotifRow
                  icon="target"
                  title="Per-horse"
                  description="Focused on a specific horse? Choose which ones to get notified about."
                  onPress={() => {}}
                />

                <View style={styles.notifDivider} />

                {/* Watch level */}
                <View style={styles.notifRow}>
                  <View style={styles.notifRowContent}>
                    <View style={styles.notifRowHeader}>
                      <Feather name="eye" size={20} color={Colors.textPrimary} />
                      <Text style={styles.notifRowTitle}>Watch level</Text>
                    </View>
                    <Text style={styles.notifRowDesc}>
                      Controls how sensitive Valkyrie is to unusual behavior. The higher the level, the more easily alerts will be triggered.
                    </Text>
                    <View style={{ marginTop: 18 }}>
                      <WatchLevelSlider
                        level={settings.paranoiaLevel ?? 3}
                        onChange={handleWatchLevel}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Sign out */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.8}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color={Colors.critical.text} />
              ) : (
                <>
                  <Feather name="log-out" size={16} color={Colors.critical.text} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "barn" && (
          <BarnSettingsTab />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Barn Settings Tab ─────────────────────────────────────────────────────────

function BarnSettingsTab() {
  const [calendarSync, setCalendarSync] = useState(true);

  const CONTACTS = [
    { name: "Kathy M.", phone: "(310) XXX - XXXX" },
    { name: "Justin J.", phone: "(310) XXX - XXXX" },
    { name: "Trent K.", phone: "(310) XXX - XXXX" },
  ];

  return (
    <View style={barnStyles.page}>
      {/* Barn name + location */}
      <View style={barnStyles.barnHeader}>
        <Text style={barnStyles.barnName}>Barn 19</Text>
        <View style={barnStyles.infoRow}>
          <Feather name="map-pin" size={16} color="#939189" />
          <Text style={barnStyles.infoText}>Brentwood, CA</Text>
        </View>
      </View>

      {/* Emergency contacts */}
      <View style={barnStyles.section}>
        <Text style={barnStyles.sectionTitle}>Emergency contacts</Text>

        <Text style={barnStyles.subLabel}>VET ON FILE</Text>

        {/* Vet card */}
        <TouchableOpacity style={barnStyles.vetCard} activeOpacity={0.85}>
          <View style={barnStyles.vetCardContent}>
            <Text style={barnStyles.vetName}>Dr. Jun</Text>
            <View style={barnStyles.vetDetails}>
              <View style={barnStyles.infoRow}>
                <Feather name="phone" size={16} color="#fbf9f0" />
                <Text style={barnStyles.vetInfoText}>(310) XXX - XXXX</Text>
              </View>
              <View style={barnStyles.infoRow}>
                <Feather name="mail" size={16} color="#fbf9f0" />
                <Text style={barnStyles.vetInfoText}>jun@horseclinic.com</Text>
              </View>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#fbf9f0" />
        </TouchableOpacity>

        {/* Other contacts */}
        {CONTACTS.map((c) => (
          <View key={c.name} style={barnStyles.contactRow}>
            <Text style={barnStyles.contactName}>{c.name}</Text>
            <View style={barnStyles.infoRow}>
              <Feather name="phone" size={16} color="#939189" />
              <Text style={barnStyles.contactPhone}>{c.phone}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Integrations */}
      <View style={barnStyles.section}>
        <TouchableOpacity style={barnStyles.sectionTitleRow} activeOpacity={0.7}>
          <View style={barnStyles.sectionTitleLeft}>
            <Feather name="grid" size={20} color={Colors.textPrimary} />
            <Text style={barnStyles.sectionTitle}>Integrations</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
        <View style={barnStyles.listRow}>
          <Text style={barnStyles.listRowLabel}>Camera connection status</Text>
          <View style={barnStyles.statusRow}>
            <View style={barnStyles.greenDot} />
            <Text style={barnStyles.listRowValue}>All Online</Text>
          </View>
        </View>
      </View>

      {/* Calendar sync */}
      <View style={barnStyles.section}>
        <View style={barnStyles.sectionTitleLeft}>
          <Feather name="calendar" size={20} color={Colors.textPrimary} />
          <Text style={barnStyles.sectionTitle}>Calendar sync</Text>
        </View>
        <View style={barnStyles.calendarRow}>
          <Text style={barnStyles.calendarDesc}>
            Sync with your default calendar for vet visits, appointments, etc.
          </Text>
          <Switch
            value={calendarSync}
            onValueChange={setCalendarSync}
            trackColor={{ false: "#ccc", true: GOLD }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Data and Privacy */}
      <View style={barnStyles.section}>
        <View style={barnStyles.sectionTitleLeft}>
          <Feather name="lock" size={20} color={Colors.textPrimary} />
          <Text style={barnStyles.sectionTitle}>Data and Privacy</Text>
        </View>
        <TouchableOpacity style={barnStyles.listRow} activeOpacity={0.7}>
          <Text style={barnStyles.listRowLabel}>Export alert history</Text>
          <Feather name="share" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={barnStyles.listRow} activeOpacity={0.7}>
          <Text style={barnStyles.listRowLabel}>Data retention settings</Text>
          <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Delete Account */}
      <TouchableOpacity style={barnStyles.deleteBtn} activeOpacity={0.8}>
        <Text style={barnStyles.deleteBtnText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function BarnRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.barnRow}>
      <Text style={styles.barnRowLabel}>{label}</Text>
      <Text style={styles.barnRowValue}>{value || "—"}</Text>
    </View>
  );
}

function BarnField({
  label, value, onChangeText, keyboard = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboard?: "default" | "email-address" | "phone-pad";
}) {
  return (
    <View style={styles.barnRow}>
      <Text style={styles.barnRowLabel}>{label}</Text>
      <TextInput
        style={styles.barnFieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        placeholderTextColor={Colors.textTertiary}
        textAlign="right"
      />
    </View>
  );
}

const CREAM = "#fbf9f0";
const WARM_GRAY = "#efede4";
const GOLD = "#bda632";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: { ...type.header, color: Colors.textPrimary },
  tabPillContainer: {
    flexDirection: "row",
    backgroundColor: WARM_GRAY,
    borderRadius: 999,
    padding: 3,
    height: 35,
  },
  tabPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabPillSelected: { backgroundColor: CREAM },
  tabPillText: { ...type.caption1, color: Colors.textTertiary },
  tabPillTextSelected: { ...type.caption1, color: Colors.textPrimary },

  scroll: { paddingHorizontal: 16 },
  section: { gap: 32, paddingTop: 8 },

  // Profile card
  profileCard: { gap: 24 },
  profileRow: { flexDirection: "row", gap: 32, alignItems: "center" },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: WARM_GRAY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { ...type.title1, color: Colors.textPrimary },
  profileInfo: { flex: 1, gap: 8 },
  profileName: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { ...type.callout, color: "#939189" },
  editProfileBtn: {
    height: 48,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileBtnText: { ...type.callout, fontWeight: "500", color: GOLD },

  // Notifications
  notifSection: { gap: 12 },
  notifTitle: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  notifList: { gap: 0 },
  notifDivider: { height: 1, backgroundColor: WARM_GRAY },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 18,
    gap: 8,
  },
  notifRowContent: { flex: 1, gap: 8 },
  notifRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifRowTitle: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  notifRowDesc: { ...type.caption1, color: Colors.textPrimary, lineHeight: 17 },
  notifRowDescBold: { ...type.caption1, fontWeight: "600", color: Colors.textPrimary },

  // Watch level slider
  sliderContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: WARM_GRAY,
    borderRadius: 88,
    paddingHorizontal: 16,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderHighlight: {
    position: "absolute",
    top: "50%",
    marginTop: -16,
    width: 80,
    height: 32,
    backgroundColor: WARM_GRAY,
    borderRadius: 88,
  },
  sliderTrack: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dotWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#c8c4bb",
  },
  dotSelected: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: GOLD,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sliderLabel: { ...type.caption1, color: Colors.textTertiary },
  behaviorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  behaviorTag: {
    backgroundColor: WARM_GRAY,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  behaviorTagText: { ...type.caption1, color: Colors.textPrimary },

  // Sign out
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.critical.bg,
  },
  signOutText: { ...type.callout, fontWeight: "600", color: Colors.critical.text },

  // Barn settings
  barnCard: {
    backgroundColor: WARM_GRAY,
    borderRadius: 12,
    padding: 18,
    gap: 16,
  },
  barnCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barnCardTitle: { ...type.caption1Medium, color: Colors.textTertiary, letterSpacing: 0.5 },
  barnFields: { gap: 12 },
  barnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  barnRowLabel: { ...type.callout, color: Colors.textTertiary },
  barnRowValue: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  barnFieldInput: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textPrimary,
    minWidth: 160,
    textAlign: "right",
  },
  editActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  cancelBtnText: { ...type.callout, fontWeight: "600", color: Colors.textPrimary },
  saveBtn: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GOLD,
    borderRadius: 8,
  },
  saveBtnText: { ...type.callout, fontWeight: "600", color: "#fff" },
});

const barnStyles = StyleSheet.create({
  page: { gap: 32, paddingTop: 8, paddingBottom: 40 },

  barnHeader: { gap: 8 },
  barnName: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { ...type.callout, color: "#939189" },

  section: { gap: 12 },
  sectionTitle: { ...type.title3, fontWeight: "500", color: Colors.textPrimary },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },

  subLabel: { ...type.caption1Medium, color: Colors.textTertiary, letterSpacing: 0.5 },

  vetCard: {
    backgroundColor: GOLD,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vetCardContent: { flex: 1, gap: 8 },
  vetName: { ...type.title3, fontWeight: "500", color: CREAM },
  vetDetails: { gap: 8 },
  vetInfoText: { ...type.callout, color: CREAM },

  contactRow: { gap: 8 },
  contactName: { ...type.callout, fontWeight: "500", color: Colors.textPrimary },
  contactPhone: { ...type.callout, color: "#939189" },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  listRowLabel: { ...type.callout, color: Colors.textPrimary },
  listRowValue: { ...type.callout, color: Colors.textPrimary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22c55e",
  },

  calendarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  calendarDesc: { ...type.caption1, color: Colors.textPrimary, flex: 1, lineHeight: 17 },

  deleteBtn: {
    height: 48,
    borderRadius: 47,
    borderWidth: 1,
    borderColor: "#e24d17",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { ...type.callout, fontWeight: "500", color: "#e24d17" },
});
