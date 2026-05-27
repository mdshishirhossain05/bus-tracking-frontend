import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken, useNotifications } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

// Show a banner while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }) as any,
});

function getProjectId(): string | undefined {
  return (
    (Constants.expoConfig as any)?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId ??
    undefined
  );
}

/**
 * Registers this device's Expo push token with the backend and routes taps.
 * Entirely best-effort: if permission is denied, there's no EAS projectId, or
 * the device is an emulator, it silently no-ops and in-app notifications still
 * work via polling.
 */
export function PushBootstrap() {
  const { refresh } = useNotifications();
  const { navigate } = useNav();
  const registered = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!Device.isDevice || registered.current) return;

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Bus alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#3b82f6",
          });
        }

        const current = await Notifications.getPermissionsAsync();
        let granted = current.granted;
        if (!granted && current.canAskAgain) {
          granted = (await Notifications.requestPermissionsAsync()).granted;
        }
        if (!granted) return;

        const projectId = getProjectId();
        const result = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : (undefined as any),
        );
        if (result?.data && active) {
          await registerPushToken(result.data, Platform.OS).catch(
            () => undefined,
          );
          registered.current = true;
        }
      } catch {
        // Push is optional — never block the app on it.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      () => void refresh(),
    );
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      navigate("notifications");
    });
    return () => sub.remove();
  }, [navigate]);

  return null;
}
