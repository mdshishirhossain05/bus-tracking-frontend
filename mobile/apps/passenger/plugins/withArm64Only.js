const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Limits the APK to arm64-v8a native libraries.
 *
 * Why: EAS produces a "universal" APK that bundles native libs for four
 * architectures (arm64-v8a, armeabi-v7a, x86, x86_64). Phones only use
 * one, but Android still verifies and dex2oat-compiles all of them on
 * install — which is the main reason fresh installs feel slow.
 *
 * arm64-v8a covers every Android device shipped from 2018 onward. If
 * support for older 32-bit ARM phones is ever needed, add "armeabi-v7a"
 * to the abiFilters list (adds ~25% to the APK).
 */
const withArm64Only = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== "groovy") return cfg;

    let contents = cfg.modResults.contents;
    if (contents.includes('abiFilters "arm64-v8a"')) return cfg;

    contents = contents.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {
        ndk {
            abiFilters "arm64-v8a"
        }`,
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
};

module.exports = withArm64Only;
