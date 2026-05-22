import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "@ubts/shared";
import { LoginScreen } from "../screens/LoginScreen";
import { LiveScreen } from "../screens/LiveScreen";
import { colors } from "@ubts/shared";

export function RootNavigator() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return status === "authenticated" ? <LiveScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
