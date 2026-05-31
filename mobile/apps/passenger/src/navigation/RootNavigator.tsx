import React, { useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth, colors } from "@ubts/shared";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { NavigationProvider } from "./NavigationContext";
import { MainNavigator } from "./MainNavigator";

type AuthScreen = "login" | "register";

export function RootNavigator() {
  const { status } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

  if (status === "loading") {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status !== "authenticated") {
    return authScreen === "register" ? (
      <RegisterScreen onBackToLogin={() => setAuthScreen("login")} />
    ) : (
      <LoginScreen onGoToRegister={() => setAuthScreen("register")} />
    );
  }

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
