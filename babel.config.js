// Reanimated requires its babel plugin, and it MUST be the LAST entry in the
// plugins array (it relies on its own AST visitor running after everything
// else). If other plugins are added later, append them above this line — do
// not move `react-native-reanimated/plugin` away from the end.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
