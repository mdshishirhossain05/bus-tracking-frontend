const fs = require("fs");
const path = require("path");

const LOCATION_USAGE =
  "Your location is used to show nearby stops and your position on the live route map.";
const BACKGROUND_LOCATION_USAGE =
  "While you are tracking a trip, UniBus Live keeps the bus status in your notifications even when the app is in the background, so you can keep an eye on your bus without staying in the app.";

// Android remote push (Expo) needs Firebase Cloud Messaging. Drop the
// Firebase `google-services.json` next to this file (or point
// GOOGLE_SERVICES_JSON at it) and it gets wired into the build. We only
// reference it when the file actually exists so a build without FCM set
// up yet doesn't fail — local + foreground-service notifications still
// work without it; only server push needs it.
const googleServicesJson =
  process.env.GOOGLE_SERVICES_JSON ??
  path.resolve(__dirname, "google-services.json");
const hasGoogleServices = fs.existsSync(googleServicesJson);

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
      NSLocationAlwaysAndWhenInUseUsageDescription: BACKGROUND_LOCATION_USAGE,
      // Keep the trip socket + live notification alive while backgrounded.
      UIBackgroundModes: ["location"],
    },
    config: {
      ...(config.ios?.config ?? {}),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
  android: {
    ...config.android,
    package: "edu.unibus.live",
    ...(hasGoogleServices ? { googleServicesFile: googleServicesJson } : {}),
    // ACCESS_BACKGROUND_LOCATION + the two FOREGROUND_SERVICE permissions are
    // what let the passenger app run a keep-alive location foreground service,
    // so the live-tracking notification stays on screen (and the trip socket
    // keeps streaming) after the rider leaves the app during a trip.
    //
    // POST_NOTIFICATIONS is REQUIRED on Android 13+ (API 33) for ANY
    // notification to appear — push, local, AND the foreground-service
    // tracking notification. Because we declare an explicit permissions
    // allowlist here, it overrides what expo-notifications would add, so
    // POST_NOTIFICATIONS has to be listed explicitly or every
    // notification is silently dropped by the OS.
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_LOCATION",
      "POST_NOTIFICATIONS",
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
        locationWhenInUsePermission: LOCATION_USAGE,
        locationAlwaysAndWhenInUsePermission: BACKGROUND_LOCATION_USAGE,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
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
});
