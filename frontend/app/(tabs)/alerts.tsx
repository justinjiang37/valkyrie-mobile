import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Line, Path, Circle } from "react-native-svg";
import { SvgXml } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import { StatusTag } from "../../src/components/StatusTag";
import { FilterSheet, type AlertFilters } from "../../src/components/FilterSheet";
import { Colors } from "../../src/constants/theme";
import { type } from "../../src/constants/typography";

type TabId = "active" | "info" | "resolved";

function CriticalIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="9" stroke="#E24D17" strokeWidth="1.5" />
      <Path d="M10 6v5" stroke="#E24D17" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="10" cy="14" r="0.75" fill="#E24D17" />
    </Svg>
  );
}

function WarningIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 3L18.66 17.5H1.34L10 3Z"
        stroke="#E7C000"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path d="M10 9v4" stroke="#E7C000" strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="10" cy="14.5" r="0.75" fill="#E7C000" />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M17.3172 10.4422L11.6922 16.0672C11.5749 16.1845 11.4159 16.2504 11.25 16.2504C11.0841 16.2504 10.9251 16.1845 10.8078 16.0672C10.6905 15.9499 10.6247 15.7909 10.6247 15.625C10.6247 15.4592 10.6905 15.3001 10.8078 15.1828L15.3664 10.625H3.125C2.95924 10.625 2.80027 10.5592 2.68306 10.442C2.56585 10.3247 2.5 10.1658 2.5 10C2.5 9.83425 2.56585 9.67528 2.68306 9.55807C2.80027 9.44086 2.95924 9.37501 3.125 9.37501H15.3664L10.8078 4.8172C10.6905 4.69992 10.6247 4.54086 10.6247 4.37501C10.6247 4.20916 10.6905 4.0501 10.8078 3.93282C10.9251 3.81555 11.0841 3.74966 11.25 3.74966C11.4159 3.74966 11.5749 3.81555 11.6922 3.93282L17.3172 9.55782C17.3753 9.61587 17.4214 9.6848 17.4529 9.76067C17.4843 9.83655 17.5005 9.91788 17.5005 10C17.5005 10.0821 17.4843 10.1635 17.4529 10.2393C17.4214 10.3152 17.3753 10.3842 17.3172 10.4422Z" fill="#2B2923" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={20} height={19} viewBox="0 0 20 19" fill="none">
      <Path d="M16.3175 13.5552C16.3756 13.6133 16.4217 13.6822 16.4531 13.7581C16.4845 13.834 16.5007 13.9153 16.5007 13.9974C16.5007 14.0795 16.4845 14.1609 16.4531 14.2367C16.4217 14.3126 16.3756 14.3815 16.3175 14.4396C16.2595 14.4977 16.1905 14.5437 16.1147 14.5752C16.0388 14.6066 15.9575 14.6228 15.8753 14.6228C15.7932 14.6228 15.7119 14.6066 15.636 14.5752C15.5602 14.5437 15.4912 14.4977 15.4332 14.4396L10.2503 9.25601L5.06753 14.4396C4.95026 14.5569 4.7912 14.6228 4.62535 14.6228C4.4595 14.6228 4.30044 14.5569 4.18316 14.4396C4.06588 14.3223 4 14.1633 4 13.9974C4 13.8316 4.06588 13.6725 4.18316 13.5552L9.36675 8.37242L4.18316 3.18961C4.06588 3.07233 4 2.91327 4 2.74742C4 2.58157 4.06588 2.42251 4.18316 2.30523C4.30044 2.18795 4.4595 2.12207 4.62535 2.12207C4.7912 2.12207 4.95026 2.18795 5.06753 2.30523L10.2503 7.48882L15.4332 2.30523C15.5504 2.18795 15.7095 2.12207 15.8753 2.12207C16.0412 2.12207 16.2003 2.18795 16.3175 2.30523C16.4348 2.42251 16.5007 2.58157 16.5007 2.74742C16.5007 2.91327 16.4348 3.07233 16.3175 3.18961L11.1339 8.37242L16.3175 13.5552Z" fill="#2B2923" />
    </Svg>
  );
}

function FilterIcon() {
  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
      <Line x1={0} y1={1.5} x2={16} y2={1.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={3} y1={6} x2={13} y2={6} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={5} y1={10.5} x2={11} y2={10.5} stroke="black" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="8.5" stroke="rgba(43,41,35,0.25)" strokeWidth="1" />
      <Path
        d="M6.5 10L9 12.5L13.5 8"
        stroke="rgba(43,41,35,0.25)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ResolvedAlertRow({
  horseName,
  horseImageUrl,
  timeAgo,
  message,
  note,
  showDivider,
}: {
  horseName: string;
  horseImageUrl: string;
  timeAgo: string;
  message: string;
  note?: string;
  showDivider: boolean;
}) {
  return (
    <>
      <View style={resolvedStyles.item}>
        <View style={resolvedStyles.row}>
          {horseImageUrl ? (
            <Image source={{ uri: horseImageUrl }} style={resolvedStyles.avatar} />
          ) : (
            <View style={[resolvedStyles.avatar, resolvedStyles.avatarPlaceholder]} />
          )}
          <View style={resolvedStyles.content}>
            <View style={resolvedStyles.nameRow}>
              <Text style={resolvedStyles.horseName}>{horseName}</Text>
              <View style={resolvedStyles.timeRow}>
                <CheckCircleIcon />
                <Text style={resolvedStyles.timeAgo}>{timeAgo}</Text>
              </View>
            </View>
            <Text style={resolvedStyles.message} numberOfLines={3}>{message}</Text>
          </View>
        </View>
        {note ? (
          <View style={resolvedStyles.noteCard}>
            <Text style={resolvedStyles.noteText}>{note}</Text>
          </View>
        ) : null}
      </View>
      {showDivider && <View style={resolvedStyles.divider} />}
    </>
  );
}

const HORSE_SVG = `<svg width="158" height="159" viewBox="0 0 158 159" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M136.808 139.236C135.488 141.106 134.788 144.58 134.549 146.565C134.682 147.31 135.541 149.135 135.337 149.862C134.221 151.395 132.253 153.238 130.366 154.151C127.885 155.347 127.548 146.707 127.885 141.558L136.534 128.469L138.554 124.65C137.331 119.873 134.416 116.665 131.5 112.97C128.266 108.876 125.501 104.658 122.39 100.271C115.451 103.621 108.034 105.358 100.395 104.87L91.9766 104.33C90.346 104.224 89.0522 104.596 87.6963 105.278L82.0868 108.078C82.397 111.455 82.5122 114.592 82.3438 118.021C82.0602 123.897 84.7188 126.6 83.7263 130.88C80.855 143.277 91.0993 155.312 82.6185 155.347L83.1945 159.175C83.7706 162.959 76.9027 162.782 71.4793 161.364L73.5263 155.551C73.9428 154.364 76.0519 152.999 77.071 152.13C79.9954 145.192 78.5864 137.659 76.3001 130.632L73.1364 120.91C72.4984 118.943 71.302 117.233 70.2386 115.239L66.2951 119.235C64.4075 121.15 64.4519 123.392 65.081 125.864C65.7102 128.336 66.1179 131.243 67.7839 133.29L70.3627 136.445C73.996 138.253 75.3873 141.771 73.5086 145.59L72.5072 149.126C69.4145 148.018 68.2093 145.431 66.3749 143.038C65.4621 141.842 62.9985 140.699 62.325 139.245C61.4123 133.946 59.9944 129.444 58.098 124.402C57.3093 122.31 58.0625 119.342 58.3284 117.144C59.0993 110.843 63.9379 109.257 67.4117 104.259C60.3754 96.2302 57.9473 84.7187 59.4893 74.439C60.7033 66.3216 56.556 61.5983 52.2669 54.438L46.9764 63.7517C45.3636 66.5964 47.0473 73.1009 42.6962 74.0314C40.7732 74.439 37.9197 74.0314 36.165 73.0655C33.2584 71.4615 31.805 68.1649 31.8228 65.0012C31.8405 62.5111 31.2999 60.3222 30.9277 57.965L29.1731 47.0561C27.1969 45.6471 26.8513 43.4937 27.9236 41.5884L28.8629 34.9243L26.4348 36.3865L28.1185 33.8077C25.6815 30.7327 24.5118 25.8233 25.9651 25.5485C27.8349 25.2029 29.8466 28.4198 32.7001 26.9753L32.0709 25.9916C31.9025 25.7258 31.9291 24.8573 32.2393 24.8307C32.5494 24.8042 33.2849 24.9903 33.5685 25.1498L35.2168 26.0714C36.0676 26.5499 38.8945 23.3065 41.7657 21.8089C44.9471 20.4087 48.1107 20.3112 51.3541 21.7291C54.6153 21.1088 58.0359 20.7543 61.1907 21.4278C63.3884 22.0836 64.8772 22.3583 67.456 22.8191C66.9863 23.4572 65.7545 24.1041 64.5139 24.494L69.8221 27.0462L70.8767 28.9603L78.4978 32.8772C80.1018 33.7014 80.988 34.8977 81.6614 36.4308C83.6554 37.6449 85.9328 38.7703 87.7849 40.4895C89.0167 41.6327 91.0018 41.8542 92.8007 42.0492L93.0489 44.1849L97.1253 45.2572C97.4443 45.3369 98.4014 45.5851 98.3925 45.8775L98.3748 47.3042C103.258 47.4638 102.859 50.1489 105.181 52.1428C107.502 54.1367 109.222 55.909 111.127 58.1865L115.584 57.2383C121.974 55.8824 128.319 55.1469 134.442 53.0821C137.96 51.8946 140.938 52.896 144.102 53.8265C150.837 55.8116 155.595 59.7994 160.585 64.4784C164.058 67.7307 166.797 70.6551 169.11 75.1037C170.749 78.2496 173.842 81.0233 175.915 83.9832L179.602 89.2648C182.464 93.359 187.143 96.2036 192.177 94.2451C193.931 93.5628 195.544 91.7461 197.272 90.5409C197.326 92.2778 196.422 93.6691 195.456 94.9807C193.754 97.2759 191.751 98.0025 188.712 98.8267L194.915 98.809C193.214 100.572 190.918 101.202 188.34 101.946L193.09 102.159C193.355 102.168 194.286 102.531 194.153 102.708C194.02 102.885 193.524 103.603 193.311 103.683L188.756 105.34L194.862 107.121L190.458 109.23L195.296 109.665C193.524 112.678 190.369 112.58 188.765 113.856C188.189 114.308 191.175 114.627 191.131 116.364C188.251 117.1 185.557 116.736 182.686 116.16C183.085 118.863 184.795 120.006 187.418 121.105L183.971 122.904C180.373 122.789 178.45 120.68 176.066 117.915L177.156 122.665L175.198 121.052C170.988 119.554 167.825 116.524 165.813 112.633C163.633 108.406 161.55 104.569 160.647 99.3761C158.351 102.247 158.555 105.181 159.379 108.477C160.691 113.75 162.685 118.845 163.465 124.242C164.448 130.995 163.084 140.814 165.352 149.002C165.902 150.996 166.167 154.275 164.076 155.099L162.561 155.702C161.852 155.985 163.022 160.159 160.992 161.214C158.068 162.72 155.179 162.153 152.033 161.231C152.937 158.342 153.858 155.702 155.781 153.451C157.704 151.2 159.176 148.089 159.016 144.908C158.67 138.12 156.747 131.349 153.566 125.368L149.516 119.102C149.782 122.497 149.366 124.703 147.248 126.865L144.208 129.967C141.425 132.803 139.263 135.771 136.808 139.236ZM148.098 116.16C147.248 113.449 146.104 111.49 144.669 109.514C145.068 112.226 146.122 114.618 148.098 116.16Z" fill="url(#paint0_linear_506_7958)"/><defs><linearGradient id="paint0_linear_506_7958" x1="111.302" y1="20.7112" x2="111.302" y2="162.296" gradientUnits="userSpaceOnUse"><stop stop-color="#C2EAF9"/><stop offset="1" stop-color="#B0DEF0"/></linearGradient></defs></svg>`;

function WatchLevelCard() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View style={styles.watchCard}>
      <SvgXml xml={HORSE_SVG} width={180} height={160} style={styles.watchCardIllustration} />
      <TouchableOpacity style={styles.watchCardDismiss} onPress={() => setDismissed(true)} hitSlop={8}>
        <CloseIcon />
      </TouchableOpacity>
      <View style={styles.watchCardContent}>
        <Text style={styles.watchCardTitle}>Set your watch level</Text>
        <Text style={styles.watchCardBody}>
          Tell us how closely to monitor each horse. Higher levels mean higher sensitivity to changes: helpful during recovery, travel stress, or seasonal changes.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.watchCardButton}
        onPress={() => router.push("/(tabs)/profile")}
        activeOpacity={0.8}
      >
        <Text style={styles.watchCardButtonText}>Manage in Profile</Text>
        <ArrowRightIcon />
      </TouchableOpacity>
    </View>
  );
}

function SectionHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function AlertRow({
  horseName,
  horseImageUrl,
  timeAgo,
  message,
  status,
  isUnread,
  showDivider,
  onPress,
}: {
  horseName: string;
  horseImageUrl: string;
  timeAgo: string;
  message: string;
  status: "healthy" | "warning" | "critical" | "info";
  isUnread: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity style={styles.alertRow} activeOpacity={0.96} onPress={onPress}>
        {horseImageUrl ? (
          <Image source={{ uri: horseImageUrl }} style={styles.horseAvatar} />
        ) : (
          <View style={[styles.horseAvatar, styles.horseAvatarPlaceholder]} />
        )}
        <View style={styles.alertContent}>
          <View style={styles.alertRowHeader}>
            <Text style={styles.alertHorseName}>{horseName}</Text>
            <View style={styles.alertRowRight}>
              <Text style={styles.alertTimeAgo}>{timeAgo}</Text>
              <StatusTag status={status} />
            </View>
          </View>
          <Text
            style={isUnread ? styles.alertMessageUnread : styles.alertMessageRead}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
      </TouchableOpacity>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

function SectionDivider() {
  return <View style={styles.sectionDivider} />;
}

export default function AlertsScreen() {
  const { alerts, horses, stalls } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<AlertFilters>({
    urgency: new Set(),
    horseIds: new Set(),
    date: null,
  });

  const markRead = (id: string) => setReadIds((prev) => new Set([...prev, id]));

  const criticalAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "critical");
  const warningAlerts = alerts.filter((a) => a.status !== "resolved" && a.severity === "warning");

  const resolvedAlerts = alerts.filter((a) => {
    if (a.status !== "resolved") return false;
    if (filters.urgency.size > 0 && !filters.urgency.has(a.severity)) return false;
    if (filters.horseIds.size > 0 && !filters.horseIds.has(a.horseId)) return false;
    if (filters.date) {
      const alertDate = new Date(a.timestamp);
      const f = filters.date;
      if (
        alertDate.getFullYear() !== f.getFullYear() ||
        alertDate.getMonth() !== f.getMonth() ||
        alertDate.getDate() !== f.getDate()
      ) return false;
    }
    return true;
  });

  const hasActiveFilters =
    filters.urgency.size > 0 || filters.horseIds.size > 0 || filters.date !== null;

  const formatTimeAgo = (timestamp: string): string => {
    const diffMin = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const handleAlertPress = (alertItem: typeof alerts[0]) => {
    markRead(alertItem.id);
    const stall = stalls.find((s) => s.id === alertItem.stallId);
    if (stall) router.push(`/stall/${stall.id}`);
  };

  const getHorse = (horseId: string) => horses.find((h) => h.id === horseId);

  const activeCount = criticalAlerts.length + warningAlerts.length;
  const infoCount = 0;

  const tabs = [
    { id: "active" as TabId, label: `Active (${activeCount})` },
    { id: "info" as TabId, label: `Info (${infoCount})` },
    { id: "resolved" as TabId, label: "Resolved" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <View style={styles.tabPillContainer}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabPill, isSelected && styles.tabPillSelected]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabPillText, isSelected && styles.tabPillTextSelected]}>
                  {tab.label}
                </Text>
                {tab.id === "resolved" && isSelected && (
                  <TouchableOpacity onPress={() => setFilterOpen(true)} hitSlop={8} style={styles.filterIconWrap}>
                    <FilterIcon />
                    {hasActiveFilters && <View style={styles.filterDot} />}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {activeTab !== "resolved" && <WatchLevelCard />}

          {activeTab === "active" && (
            <View style={styles.sectionsContainer}>
              <View style={styles.section}>
                <SectionHeader label="CRITICAL" icon={<CriticalIcon />} />
                {criticalAlerts.length > 0 ? (
                  <View style={styles.cardBg}>
                    {criticalAlerts.map((alert, index) => {
                      const horse = getHorse(alert.horseId);
                      return (
                        <AlertRow
                          key={alert.id}
                          horseName={horse?.name ?? "Unknown"}
                          horseImageUrl={horse?.imageUrl ?? ""}
                          timeAgo={formatTimeAgo(alert.timestamp)}
                          message={alert.message}
                          status="critical"
                          isUnread={!readIds.has(alert.id)}
                          showDivider={index < criticalAlerts.length - 1}
                          onPress={() => handleAlertPress(alert)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No critical alerts.</Text>
                )}
              </View>

              <SectionDivider />

              <View style={styles.section}>
                <SectionHeader label="WARNING" icon={<WarningIcon />} />
                {warningAlerts.length > 0 ? (
                  <View>
                    {warningAlerts.map((alert, index) => {
                      const horse = getHorse(alert.horseId);
                      return (
                        <AlertRow
                          key={alert.id}
                          horseName={horse?.name ?? "Unknown"}
                          horseImageUrl={horse?.imageUrl ?? ""}
                          timeAgo={formatTimeAgo(alert.timestamp)}
                          message={alert.message}
                          status="warning"
                          isUnread={!readIds.has(alert.id)}
                          showDivider={index < warningAlerts.length - 1}
                          onPress={() => handleAlertPress(alert)}
                        />
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No warning alerts.</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === "info" && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No info alerts.</Text>
            </View>
          )}

          {activeTab === "resolved" && (() => {
            const criticalResolved = resolvedAlerts.filter((a) => a.severity === "critical");
            const warningResolved = resolvedAlerts.filter((a) => a.severity === "warning");
            if (resolvedAlerts.length === 0) {
              return (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {hasActiveFilters ? "No resolved alerts match your filters." : "No resolved alerts."}
                  </Text>
                </View>
              );
            }
            return (
              <View style={styles.sectionsContainer}>
                {criticalResolved.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader label="CRITICAL" icon={<CriticalIcon />} />
                    <View>
                      {criticalResolved.map((alert, index) => {
                        const horse = getHorse(alert.horseId);
                        return (
                          <ResolvedAlertRow
                            key={alert.id}
                            horseName={horse?.name ?? "Unknown"}
                            horseImageUrl={horse?.imageUrl ?? ""}
                            timeAgo={formatTimeAgo(alert.timestamp)}
                            message={alert.message}
                            note={alert.note}
                            showDivider={index < criticalResolved.length - 1}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
                {criticalResolved.length > 0 && warningResolved.length > 0 && (
                  <SectionDivider />
                )}
                {warningResolved.length > 0 && (
                  <View style={styles.section}>
                    <SectionHeader label="WARNING" icon={<WarningIcon />} />
                    <View>
                      {warningResolved.map((alert, index) => {
                        const horse = getHorse(alert.horseId);
                        return (
                          <ResolvedAlertRow
                            key={alert.id}
                            horseName={horse?.name ?? "Unknown"}
                            horseImageUrl={horse?.imageUrl ?? ""}
                            timeAgo={formatTimeAgo(alert.timestamp)}
                            message={alert.message}
                            note={alert.note}
                            showDivider={index < warningResolved.length - 1}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        horses={horses}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    ...type.header,
    color: Colors.textPrimary,
  },
  tabPillContainer: {
    flexDirection: "row",
    backgroundColor: "#efede4",
    borderRadius: 999,
    padding: 3,
    height: 35,
  },
  tabPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
  },
  tabPillSelected: {
    backgroundColor: Colors.white,
  },
  tabPillText: {
    ...type.caption1,
    color: Colors.textTertiary,
  },
  tabPillTextSelected: {
    color: Colors.textPrimary,
  },
  scrollView: { flex: 1 },
  scrollContent: { gap: 24, paddingTop: 8 },

  // Watch level card
  watchCard: {
    backgroundColor: "#b0def0",
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
    gap: 24,
    overflow: "hidden",
  },
  watchCardIllustration: {
    position: "absolute",
    right: -10,
    top: 10,
    width: 180,
    height: 160,
    opacity: 0.6,
  },
  watchCardDismiss: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
  },
  watchCardContent: { gap: 8, width: "65%" },
  watchCardTitle: {
    ...type.title3,
    fontWeight: "500",
    color: "#2b2923",
  },
  watchCardBody: {
    ...type.caption1,
    color: "#2b2923",
    lineHeight: 17,
  },
  watchCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 33,
    height: 48,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  watchCardButtonText: {
    ...type.body,
    color: Colors.textPrimary,
  },

  // Sections
  sectionsContainer: { gap: 24 },
  section: { gap: 12, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionLabel: {
    ...type.caption1,
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  cardBg: {
    backgroundColor: "#efede4",
    borderRadius: 8,
    overflow: "hidden",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginHorizontal: 16,
  },

  // Alert rows
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  horseAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  horseAvatarPlaceholder: {
    backgroundColor: Colors.cardBg,
  },
  alertContent: {
    flex: 1,
    gap: 8,
  },
  alertRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  alertRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  alertHorseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  alertTimeAgo: {
    ...type.caption1,
    color: Colors.textFaint,
  },
  alertMessageRead: {
    ...type.callout,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  alertMessageUnread: {
    ...type.callout,
    fontWeight: "500",
    color: Colors.textSecondary,
  },

  // Empty states
  filterIconWrap: { position: "relative" },
  filterDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#bda632",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    ...type.callout,
    color: Colors.textQuaternary,
    paddingHorizontal: 16,
  },
});

const resolvedStyles = StyleSheet.create({
  item: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    flexShrink: 0,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.cardBg,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  horseName: {
    ...type.headline,
    color: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeAgo: {
    ...type.caption1,
    color: "rgba(43,41,35,0.25)",
  },
  message: {
    ...type.callout,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
  noteCard: {
    backgroundColor: "#efede4",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noteText: {
    ...type.callout,
    fontStyle: "italic",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginVertical: 20,
  },
});
