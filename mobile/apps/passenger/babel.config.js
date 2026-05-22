module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 ships its worklet transform via react-native-worklets.
    // This plugin MUST stay last in the list.
    plugins: ["react-native-worklets/plugin"],
  };
};
