const CopyWebpackPlugin = require('copy-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: ['./client/game.js'],
  devtool: 'inline-source-map',
  target: "web",
  devServer: {
    hot: true,
    port: 8080,
    host: `localhost`,
    proxy: {
      '/api': {
        target: 'http://localhost:6969',
        secure: false
      },
    }
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: 'static/assets',
      to: 'assets'
    }]),
    new HTMLWebpackPlugin({
      template: 'static/index.html',
      filename: 'index.html',
      favicon: 'static/favicon.ico'
    })
  ]
}