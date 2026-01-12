module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // If you are using Reanimated, it MUST be last. 
      // If not, leave this array empty or remove it.
    ],
  };
};