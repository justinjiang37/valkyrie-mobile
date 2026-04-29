import React, { useState } from "react";
import { FlatList, Text, StyleSheet, View, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useApp } from "../../src/context/AppContext";
import StallCard from "../../src/components/StallCard";
import AlertItem from "../../src/components/AlertItem";
import { Colors } from "../../src/constants/theme";

function SparkLogo() {
  return (
    <Svg width={23} height={27} viewBox="0 0 23 27" fill="none">
      <Path d="M0.37418 -1.85373e-06L13.7567 4.28575C17.8679 5.60236 20.1368 10.0092 18.8202 14.1204L5.43768 9.83462C1.32648 8.51801 -0.942431 4.1112 0.37418 -1.85373e-06Z" fill="#2B2923" />
      <Path d="M5.53739 11.2516L19.5599 15.7423C21.5955 16.3942 22.7194 18.5771 22.0675 20.6127L21.6583 21.8905L8.91356 17.809C6.17127 16.9308 4.65917 13.9939 5.53739 11.2516Z" fill="#2B2923" />
      <Path d="M14.3157 20.8547L21.4211 23.1037L20.8564 24.8878C20.4935 26.0344 19.2697 26.6698 18.1231 26.3068L16.9542 25.9369C14.8222 25.262 13.6409 22.9867 14.3157 20.8547Z" fill="#2B2923" />
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
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M9.375 3.125V1.25C9.375 1.08424 9.44085 0.925268 9.55806 0.808058C9.67527 0.690848 9.83424 0.625 10 0.625C10.1658 0.625 10.3247 0.690848 10.4419 0.808058C10.5592 0.925268 10.625 1.08424 10.625 1.25V3.125C10.625 3.29076 10.5592 3.44973 10.4419 3.56694C10.3247 3.68415 10.1658 3.75 10 3.75C9.83424 3.75 9.67527 3.68415 9.55806 3.56694C9.44085 3.44973 9.375 3.29076 9.375 3.125ZM15 10C15 10.9889 14.7068 11.9556 14.1573 12.7779C13.6079 13.6001 12.827 14.241 11.9134 14.6194C10.9998 14.9978 9.99445 15.0969 9.02455 14.9039C8.05464 14.711 7.16373 14.2348 6.46447 13.5355C5.7652 12.8363 5.289 11.9454 5.09607 10.9755C4.90315 10.0055 5.00216 9.00021 5.3806 8.08658C5.75904 7.17295 6.3999 6.39206 7.22215 5.84265C8.04439 5.29324 9.01109 5 10 5C11.3256 5.00145 12.5966 5.5287 13.5339 6.46606C14.4713 7.40343 14.9986 8.67436 15 10ZM13.75 10C13.75 9.25832 13.5301 8.5333 13.118 7.91661C12.706 7.29993 12.1203 6.81928 11.4351 6.53545C10.7498 6.25162 9.99584 6.17736 9.26841 6.32206C8.54098 6.46675 7.8728 6.8239 7.34835 7.34835C6.8239 7.8728 6.46675 8.54098 6.32206 9.26841C6.17736 9.99584 6.25162 10.7498 6.53545 11.4351C6.81928 12.1203 7.29993 12.706 7.91661 13.118C8.5333 13.5301 9.25832 13.75 10 13.75C10.9942 13.749 11.9475 13.3535 12.6505 12.6505C13.3535 11.9475 13.749 10.9942 13.75 10ZM4.55781 5.44219C4.67509 5.55946 4.83415 5.62535 5 5.62535C5.16585 5.62535 5.32491 5.55946 5.44219 5.44219C5.55946 5.32491 5.62535 5.16585 5.62535 5C5.62535 4.83415 5.55946 4.67509 5.44219 4.55781L4.19219 3.30781C4.07491 3.19054 3.91585 3.12465 3.75 3.12465C3.58415 3.12465 3.42509 3.19054 3.30781 3.30781C3.19054 3.42509 3.12465 3.58415 3.12465 3.75C3.12465 3.91585 3.19054 4.07491 3.30781 4.19219L4.55781 5.44219ZM4.55781 14.5578L3.30781 15.8078C3.19054 15.9251 3.12465 16.0841 3.12465 16.25C3.12465 16.4159 3.19054 16.5749 3.30781 16.6922C3.42509 16.8095 3.58415 16.8753 3.75 16.8753C3.91585 16.8753 4.07491 16.8095 4.19219 16.6922L5.44219 15.4422C5.50026 15.3841 5.54632 15.3152 5.57775 15.2393C5.60917 15.1634 5.62535 15.0821 5.62535 15C5.62535 14.9179 5.60917 14.8366 5.57775 14.7607C5.54632 14.6848 5.50026 14.6159 5.44219 14.5578C5.38412 14.4997 5.31518 14.4537 5.23931 14.4223C5.16344 14.3908 5.08212 14.3747 5 14.3747C4.91788 14.3747 4.83656 14.3908 4.76069 14.4223C4.68482 14.4537 4.61588 14.4997 4.55781 14.5578ZM15 5.625C15.0821 5.62506 15.1634 5.60895 15.2393 5.57759C15.3152 5.54622 15.3841 5.50021 15.4422 5.44219L16.6922 4.19219C16.8095 4.07491 16.8753 3.91585 16.8753 3.75C16.8753 3.58415 16.8095 3.42509 16.6922 3.30781C16.5749 3.19054 16.4159 3.12465 16.25 3.12465C16.0841 3.12465 15.9251 3.19054 15.8078 3.30781L14.5578 4.55781C14.4703 4.64522 14.4107 4.75663 14.3865 4.87793C14.3624 4.99924 14.3748 5.12498 14.4221 5.23924C14.4695 5.35351 14.5496 5.45116 14.6525 5.51982C14.7554 5.58849 14.8763 5.6251 15 5.625ZM15.4422 14.5578C15.3249 14.4405 15.1659 14.3747 15 14.3747C14.8341 14.3747 14.6751 14.4405 14.5578 14.5578C14.4405 14.6751 14.3747 14.8341 14.3747 15C14.3747 15.1659 14.4405 15.3249 14.5578 15.4422L15.8078 16.6922C15.8659 16.7503 15.9348 16.7963 16.0107 16.8277C16.0866 16.8592 16.1679 16.8753 16.25 16.8753C16.3321 16.8753 16.4134 16.8592 16.4893 16.8277C16.5652 16.7963 16.6341 16.7503 16.6922 16.6922C16.7503 16.6341 16.7963 16.5652 16.8277 16.4893C16.8592 16.4134 16.8753 16.3321 16.8753 16.25C16.8753 16.1679 16.8592 16.0866 16.8277 16.0107C16.7963 15.9348 16.7503 15.8659 16.6922 15.8078L15.4422 14.5578ZM3.75 10C3.75 9.83424 3.68415 9.67527 3.56694 9.55806C3.44973 9.44085 3.29076 9.375 3.125 9.375H1.25C1.08424 9.375 0.925268 9.44085 0.808058 9.55806C0.690848 9.67527 0.625 9.83424 0.625 10C0.625 10.1658 0.690848 10.3247 0.808058 10.4419C0.925268 10.5592 1.08424 10.625 1.25 10.625H3.125C3.29076 10.625 3.44973 10.5592 3.56694 10.4419C3.68415 10.3247 3.75 10.1658 3.75 10ZM10 16.25C9.83424 16.25 9.67527 16.3158 9.55806 16.4331C9.44085 16.5503 9.375 16.7092 9.375 16.875V18.75C9.375 18.9158 9.44085 19.0747 9.55806 19.1919C9.67527 19.3092 9.83424 19.375 10 19.375C10.1658 19.375 10.3247 19.3092 10.4419 19.1919C10.5592 19.0747 10.625 18.9158 10.625 18.75V16.875C10.625 16.7092 10.5592 16.5503 10.4419 16.4331C10.3247 16.3158 10.1658 16.25 10 16.25ZM18.75 9.375H16.875C16.7092 9.375 16.5503 9.44085 16.4331 9.55806C16.3158 9.67527 16.25 9.83424 16.25 10C16.25 10.1658 16.3158 10.3247 16.4331 10.4419C16.5503 10.5592 16.7092 10.625 16.875 10.625H18.75C18.9158 10.625 19.0747 10.5592 19.1919 10.4419C19.3092 10.3247 19.375 10.1658 19.375 10C19.375 9.83424 19.3092 9.67527 19.1919 9.55806C19.0747 9.44085 18.9158 9.375 18.75 9.375Z" fill="#2B2923" fillOpacity="0.5" />
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
