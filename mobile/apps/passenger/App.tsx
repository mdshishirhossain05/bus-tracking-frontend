import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  AuthProvider,
  LocaleProvider,
  NotificationsProvider,
  colors,
} from "@ubts/shared";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/components/OnboardingScreen";

const ONBOARDING_KEY = "ubts.onboardingDone";

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(ONBOARDING_KEY);
        setOnboardingDone(seen === "1");
      } catch {
        // If SecureStore fails (rare), don't gate the app on onboarding.
        setOnboardingDone(true);
      }
    })();
  }, []);

  if (!fontsLoaded || onboardingDone === null) return null;

  const dismissOnboarding = async () => {
    setOnboardingDone(true);
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
    } catch {
      // Best-effort persistence; falling back to in-memory is fine.
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <NotificationsProvider>
              <StatusBar style="light" />
              {onboardingDone ? (
                <RootNavigator />
              ) : (
                <OnboardingScreen onDone={dismissOnboarding} />
              )}
            </NotificationsProvider>
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = { root: { flex: 1, backgroundColor: colors.background } } as const;
