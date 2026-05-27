import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth, colors } from "@ubts/shared";
import { LoginScreen } from "../screens/LoginScreen";
import { NavigationProvider } from "./NavigationContext";
import { MainNavigator } from "./MainNavigator";

export function RootNavigator() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status !== "authenticated") return <LoginScreen />;

  return (
    <NavigationProvider>
      <MainNavigator />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
