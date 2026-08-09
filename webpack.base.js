const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

// Shared webpack config factory used by every product package's own
// webpack.config.js, so loader rules and preact/CSS-modules setup live in
// one place instead of being copy-pasted per card.
module.exports = ({ entry, outputFilename, outputPath }) => {
  // Every product package mirrors the same src/card/card.module.css shape,
  // and css-loader's [hash:base64:5] here turns out to depend only on the
  // class name, not the file's path or content — confirmed empirically:
  // `.root`, `.header`, `.content`, etc. hashed to the exact same generated
  // class name in room-card and printer-card. Since every card's
  // injectCardStyles (see each package's src/index.tsx) clones every
  // <style data-card-style> tag it finds in document.head into its own
  // subtree — not just its own — that let one card's CSS silently override
  // another's whenever both used the same class name and the other card's
  // stylesheet happened to be cloned in after it (e.g. one card's `.root`
  // rule bleeding into another). Prefixing with the package's own output
  // filename guarantees no cross-package collision regardless of why the
  // hash portion collides.
  const packageId = outputFilename.replace(/\.js$/, '');

  return {
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
          // Inlined as a base64 data URI rather than emitted as a separate
          // asset file: a card ships as a single dist/<name>.js, so a
          // separately-emitted file would never reach Home Assistant.
          test: /\.png$/,
          type: 'asset/inline',
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
                  localIdentName: `${packageId}-[local]--[hash:base64:5]`,
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
  };
};
