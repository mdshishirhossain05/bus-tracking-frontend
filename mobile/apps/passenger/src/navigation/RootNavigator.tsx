import React, { useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth, colors } from "@ubts/shared";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { NavigationProvider } from "./NavigationContext";
import { MainNavigator } from "./MainNavigator";

type AuthScreen = "login" | "register" | "forgotPassword";

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
    if (authScreen === "register") {
      return <RegisterScreen onBackToLogin={() => setAuthScreen("login")} />;
    }
    if (authScreen === "forgotPassword") {
      return (
        <ForgotPasswordScreen onBackToLogin={() => setAuthScreen("login")} />
      );
    }
    return (
      <LoginScreen
        onGoToRegister={() => setAuthScreen("register")}
        onGoToForgotPassword={() => setAuthScreen("forgotPassword")}
      />
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
