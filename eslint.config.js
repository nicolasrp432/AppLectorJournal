// ESLint flat config for Expo SDK 54 (ESLint 9)
// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      'dist/*',
      'node_modules/*',
      'bundle.js',
      'exact_bundle.js',
      'post-export.js',
      '.expo/*',
      'supabase/functions/*', // Deno runtime, separate toolchain
    ],
  },
];
