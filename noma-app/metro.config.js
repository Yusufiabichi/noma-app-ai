const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

// 1. Transformer settings
config.transformer = {
  ...transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// 2. Handle TensorFlow binary assets correctly
config.resolver = {
  ...resolver,
  // Ensure 'bin' is in assetExts so it's treated as a file/resource
  assetExts: [...resolver.assetExts, 'bin'],
  // Ensure 'bin' is NOT in sourceExts (this prevents the SyntaxError)
  sourceExts: [...resolver.sourceExts, 'js', 'jsx', 'json', 'ts', 'tsx'],
};

module.exports = config;