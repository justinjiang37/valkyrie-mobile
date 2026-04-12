import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider } from "../src/context/AppContext";
import { Colors } from "../src/constants/theme";

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="stall/[id]"
          options={{
            headerShown: true,
            headerTitle: "Stall Detail",
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </AppProvider>
  );
}
