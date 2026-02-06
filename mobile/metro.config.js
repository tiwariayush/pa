const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web support works with SDK 54
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs'];

module.exports = config;
