import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@ubts/shared";
import { useNav, type ScreenEntry } from "./NavigationContext";
import { LiveScreen } from "../screens/LiveScreen";
import { RoutesScreen } from "../screens/RoutesScreen";
import { RouteDetailScreen } from "../screens/RouteDetailScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { NotificationPreferencesScreen } from "../screens/NotificationPreferencesScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PushBootstrap } from "../components/PushBootstrap";

function renderScreen(entry: ScreenEntry) {
  switch (entry.name) {
    case "routes":
      return <RoutesScreen />;
    case "routeDetail":
      return (
        <RouteDetailScreen
          routeId={entry.params?.routeId ?? ""}
          routeName={entry.params?.routeName ?? "Route"}
        />
      );
    case "notifications":
      return <NotificationsScreen />;
    case "notificationPreferences":
      return <NotificationPreferencesScreen />;
    case "history":
      return <HistoryScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return null;
  }
}

export function MainNavigator() {
  const { stack } = useNav();
  return (
    <View style={styles.root}>
      <PushBootstrap />
      <LiveScreen />
      {stack.map((entry) => (
        <View key={entry.key} style={styles.overlay}>
          {renderScreen(entry)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
});
