import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Text, colors, spacing, useAuth } from "@ubts/shared";
import { DriverLoginScreen } from "../screens/DriverLoginScreen";
import { DriverHomeScreen } from "../screens/DriverHomeScreen";

export function RootNavigator() {
  const { status, user, signOut } = useAuth();

  if (status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status !== "authenticated") {
    return <DriverLoginScreen />;
  }

  // Guard the driver tool against non-driver accounts signing in.
  if (user?.role !== "DRIVER") {
    return (
      <View style={styles.centered}>
        <Text variant="title" color={colors.foreground}>
          Drivers only
        </Text>
        <Text variant="body" color={colors.mutedForeground} style={styles.center}>
          This app is for bus drivers. Your account is a{" "}
          {user?.role?.toLowerCase() ?? "different"} account.
        </Text>
        <Pressable onPress={signOut} style={styles.signOut}>
          <Text variant="label" color={colors.primary}>
            Sign out
          </Text>
        </Pressable>
      </View>
    );
  }

  return <DriverHomeScreen />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  center: { textAlign: "center" },
  signOut: { marginTop: spacing.md },
});
