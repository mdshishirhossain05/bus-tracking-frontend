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
  ],
});
