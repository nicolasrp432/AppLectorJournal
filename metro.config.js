const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web: resolve .web.ts/.web.tsx before .ts/.tsx so platform-specific
// overrides work (e.g. charts.web.tsx vs charts.tsx)
config.resolver.sourceExts = [
  'web.tsx', 'web.ts', 'web.jsx', 'web.js',
  ...config.resolver.sourceExts,
];

// Allow Skia WASM binary to be bundled for web
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'wasm',
];

// On web: redirect react-native-reanimated and react-native-worklets to a
// JS stub so native worklet threads are never initialized in the browser.
// Uses startsWith to catch both the root import AND any internal sub-paths
// the Reanimated Babel plugin may inject (e.g. react-native-worklets/src/...).
var STUB = path.resolve(__dirname, 'lib/reanimated.web.stub.js');

config.resolver.resolveRequest = function (context, moduleName, platform) {
  // Web-specific overrides
  if (platform === 'web') {
    if (
      moduleName === 'react-native-reanimated' ||
      moduleName.startsWith('react-native-reanimated/') ||
      moduleName === 'react-native-worklets' ||
      moduleName.startsWith('react-native-worklets/') ||
      moduleName === 'react-native-worklets-core' ||
      moduleName.startsWith('react-native-worklets-core/')
    ) {
      return { filePath: STUB, type: 'sourceFile' };
    }
  }

  // FORCE ZUSTAND TO USE COMMONJS (.js) INSTEAD OF ESM (.mjs)
  // This completely eliminates the "import.meta.env" SyntaxError on Expo Web
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const resolved = context.resolveRequest(context, moduleName, platform);
    if (resolved && resolved.type === 'sourceFile' && resolved.filePath.includes('zustand')) {
      if (resolved.filePath.endsWith('.mjs')) {
        // Normalize slashes for Windows compatibility
        resolved.filePath = resolved.filePath.replace(/[\\/]esm[\\/]/, path.sep).replace(/\.mjs$/, '.js');
      }
    }
    return resolved;
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
