/* eslint-env node */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo root so Metro sees hoisted packages
config.watchFolders = [workspaceRoot];

// Resolve packages from both mobile/node_modules and root node_modules (hoisted)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const metroConfig = withNativeWind(config, { input: './global.css', inlineRem: 16 });

metroConfig.resolver.unstable_enablePackageExports = true;
metroConfig.resolver.unstable_conditionNames = ['react-native', 'browser', 'require', 'node'];

module.exports = metroConfig;
