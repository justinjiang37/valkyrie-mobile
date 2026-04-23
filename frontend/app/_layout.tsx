import React, { useEffect } from "react";
import { View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "../src/context/AppContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { Colors } from "../src/constants/theme";

// Phone frame wrapper for web - shows app in iPhone-sized container
function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={webStyles.container}>
      <View style={webStyles.phoneFrame}>
        <View style={webStyles.notch} />
        {children}
      </View>
    </View>
  );
}

// Auth guard - redirects based on auth state
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
});

const webStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  phoneFrame: {
    width: 390,
    height: 844,
    backgroundColor: Colors.background,
    borderRadius: 44,
    overflow: "hidden",
    position: "relative",
    // @ts-ignore - web-only shadow
    boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  },
  notch: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -60,
    width: 120,
    height: 34,
    backgroundColor: "#000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 100,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <PhoneFrame>
          <StatusBar style="dark" />
          <AuthGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="stall/[id]"
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerBackTitle: "Feeds",
                  headerStyle: { backgroundColor: Colors.background },
                  headerTintColor: Colors.textPrimary,
                  headerShadowVisible: false,
                }}
              />
            </Stack>
          </AuthGuard>
        </PhoneFrame>
      </AppProvider>
    </AuthProvider>
  );
}
