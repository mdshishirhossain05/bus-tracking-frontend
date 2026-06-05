import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken, useNotifications } from "@ubts/shared";
import { useNav } from "../navigation/NavigationContext";

// Show a heads-up banner while the app is foregrounded too.
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
 * The Android notification channel is created unconditionally — channel
 * creation is a manifest-level setup that has to exist before any push
 * arrives, including pushes sent to emulators in dev. Token registration
 * still gates on a real device because Expo push doesn't issue tokens
 * for the emulator.
 */
export function PushBootstrap() {
  const { refresh } = useNotifications();
  const { navigate } = useNav();
  const registered = useRef(false);

  useEffect(() => {
    let active = true;

    (async () => {
      // ---- Channel setup first, always. ----
      // On Android, this MUST exist before any incoming push is processed,
      // otherwise the system silently drops the notification with no UI
      // surface. We create it on every launch (idempotent) so a token
      // registration race can't beat us to it.
      if (Platform.OS === "android") {
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Bus alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#3b82f6",
            sound: "default",
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            enableLights: true,
            enableVibrate: true,
          });
        } catch {
          // Channel creation failures are non-fatal — push may still work
          // if a default channel was created previously.
        }
      }

      // ---- Permission request (always, even on emulators so the UX is
      // consistent — emulator just won't deliver real pushes). ----
      try {
        const current = await Notifications.getPermissionsAsync();
        let granted = current.granted;
        if (!granted && current.canAskAgain) {
          const requested = await Notifications.requestPermissionsAsync({
            android: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            } as any,
          });
          granted = requested.granted;
        }
        if (!granted) return;
      } catch {
        return;
      }

      // ---- Token fetch + register (real devices only). ----
      try {
        if (!Device.isDevice || registered.current) return;
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
