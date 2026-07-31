const path = require('path');
const { execSync } = require('child_process');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim().replace(/[^a-zA-Z0-9-]+/g, '-');

module.exports = {
  entry: './src/index.tsx',
  devServer: {
    static: './dist',
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
    filename: `${branch}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
};
