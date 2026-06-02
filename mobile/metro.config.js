/* eslint-env node */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname); // ✅ This works in CommonJS

config.watchFolders = [path.resolve(__dirname, '../shared')];

//

const metroConfig = withNativeWind(config);

metroConfig.resolver.unstable_enablePackageExports = true;
metroConfig.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'node'];

metroConfig.resolver.extraNodeModules = {
  '@schnl/shared': path.resolve(__dirname, '../shared'),
  'zod/v4': path.resolve(__dirname, '../shared/zod/v4.ts'),
  zod: path.resolve(__dirname, 'node_modules/zod'),
  ibantools: path.resolve(__dirname, 'node_modules/ibantools'),
  'drizzle-orm': path.resolve(__dirname, 'node_modules/drizzle-orm'),
  '@tolbel/align': path.resolve(__dirname, 'node_modules/@tolbel/align'),
  validator: path.resolve(__dirname, 'node_modules/validator'),
};

module.exports = metroConfig;
