module.exports = function (api) {
  api.cache(true);
  const plugins = [
    [
      'module-resolver',
      {
        alias: {
          crypto: 'react-native-quick-crypto',
          stream: 'stream-browserify',
          buffer: '@craftzdog/react-native-buffer',
        },
      },
    ],

    'react-native-reanimated/plugin',
  ];

  // Remove console statements in production
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],

    plugins,
  };
};
