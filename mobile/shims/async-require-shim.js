/* eslint-disable */
/**
 * Async Require Shim for Production Builds
 *
 * CONTEXT:
 * 1. Build Requirement: The production build pipeline (pnpm/monorepo) requires an explicit resolution
 *    for '@expo/metro-config/async-require' or the build fails.
 * 2. Runtime Issue: Redirecting to '@expo/metro-runtime' causes a crash on Hermes because Hermes
 *    passes a numeric Module ID, while Expo's loader expects a constrained bundle path string.
 *
 * SOLUTION:
 * This shim acts as a polymorphic adapter. It satisfies the build requirement by existing,
 * and prevents the runtime crash by handling the numeric ID case directly.
 */

// Initialize the standard Expo loader (for Web/Updates compatibility)
let expoLoader;
try {
  require('@expo/metro-runtime/async-require');
  const prefix = global.__METRO_GLOBAL_PREFIX__ ?? '';
  expoLoader = global[`${prefix}__loadBundleAsync`];
} catch (e) {
  // Ignore errors if the runtime package is missing in this context
}

module.exports = function (pathOrId) {
  // CASE 1: Hermes / Native (Numeric Module ID)
  // Fixes the "bundlePath.match is not a function" crash by handling numbers directly
  if (typeof pathOrId === 'number') {
    return new Promise((resolve, reject) => {
      try {
        // Use global.require or Metro's internal __r to bypass static analysis
        const safeRequire = global.require || global.__r;
        if (safeRequire) {
          resolve(safeRequire(pathOrId));
        } else {
          reject(new Error('AsyncRequireShim: global.require not found'));
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  // CASE 2: Web / Expo Updates (String Path)
  // Delegate to the original loader for standard Expo behavior
  if (expoLoader) {
    return expoLoader.apply(this, arguments);
  }

  return Promise.reject(new Error('AsyncRequireShim: Unhandled argument type: ' + typeof pathOrId));
};
