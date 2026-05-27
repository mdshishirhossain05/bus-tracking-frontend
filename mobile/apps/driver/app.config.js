const FG_USAGE =
  "Your location is shared with passengers only while you are on an active trip.";
const BG_USAGE =
  "UniBus Driver keeps sharing the bus location in the background during an active trip, so riders see it move in real time even when your screen is off.";

/**
 * Driver app config. The decisive difference from the passenger app: it
 * declares BACKGROUND location (iOS UIBackgroundModes + Always permission,
 * Android background-location + a foreground service). This is exactly the
 * capability a browser/web app can't have — and the reason drivers get a
 * dedicated, controlled-distribution app instead of role-switching the
 * public passenger app.
 */
module.exports = ({ config }) => ({
  ...config,
  name: "UniBus Driver",
  slug: "unibus-driver",
  scheme: "unibusdriver",
  userInterfaceStyle: "dark",
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: "edu.unibus.driver",
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      NSLocationWhenInUseUsageDescription: FG_USAGE,
      NSLocationAlwaysAndWhenInUseUsageDescription: BG_USAGE,
      UIBackgroundModes: ["location"],
    },
    config: {
      ...(config.ios?.config ?? {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    package: "edu.unibus.driver",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
    ],
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-location",
      {
        locationWhenInUsePermission: FG_USAGE,
        locationAlwaysAndWhenInUsePermission: BG_USAGE,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
});
