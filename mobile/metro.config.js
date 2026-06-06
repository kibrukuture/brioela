/* eslint-env node */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const metroConfig = withNativeWind(config, { input: './global.css', inlineRem: 16 });

metroConfig.resolver.unstable_enablePackageExports = true;
metroConfig.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'node'];

module.exports = metroConfig;
