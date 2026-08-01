const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// Shared webpack config factory used by every product package's own
// webpack.config.js, so loader rules and preact/CSS-modules setup live in
// one place instead of being copy-pasted per card.
module.exports = ({ entry, outputFilename, outputPath }) => ({
  entry,
  devServer: {
    static: outputPath,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              attributes: {
                'data-card-style': 'true',
              },
            },
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false,
              modules: {
                localIdentName: '[local]--[hash:base64:5]',
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    plugins: [new TsconfigPathsPlugin({})],
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      react: 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom': 'preact/compat', // Must be below test-utils
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
  output: {
    filename: outputFilename,
    path: outputPath,
  },
});
