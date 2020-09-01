const CopyWebpackPlugin = require('copy-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production',
  target: "web",
  entry: './client/game.js',
  module: {
    rules: [{
      test: /\.(js)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      }
    },
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: 'static/assets',
      to: 'assets'
    }]),
    new HTMLWebpackPlugin({
      template: 'static/index.html',
      filename: 'index.html',
      favicon: 'static/favicon.ico',
      hash: true,
      minify: false
    }),
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        ecma: 6,
      },
    })
  ]
}