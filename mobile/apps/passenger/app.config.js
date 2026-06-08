const LOCATION_USAGE =
  "Your location is used to show nearby stops and your position on the live route map.";

/**
 * Dynamic config so the Google Maps key and permission strings come from env.
 * The static `app.json` is received as `config` and selectively overridden.
 */
module.exports = ({ config }) => ({
  ...config,
  name: "UniBus Live",
  slug: "unibus-live",
  scheme: "unibuslive",
  userInterfaceStyle: "dark",
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: "edu.unibus.live",
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
    },
    config: {
      ...(config.ios?.config ?? {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    package: "edu.unibus.live",
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  plugins: [
    ...(config.plugins ?? []),
    ["expo-location", { locationWhenInUsePermission: LOCATION_USAGE }],
    "expo-notifications",
    [
      "expo-build-properties",
      {
        android: {
          // ProGuard + resource shrinking trim ~30-50% of the release APK
          // by removing unused Java code and Android resources, and dex2oat
          // has much less to compile at install time, so install + cold
          // start drop noticeably.
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    "./plugins/withArm64Only",
  ],
  extra: {
    ...(config.extra ?? {}),
    eas: {
      ...(config.extra?.eas ?? {}),
      // Required for Notifications.getExpoPushTokenAsync to issue a real
      // production push token. Without this, push silently fails.
      projectId: "499ce835-0a79-4f86-8590-85b31d52163e",
    },
  },
});
