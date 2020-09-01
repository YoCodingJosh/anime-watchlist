var nodemon = require('nodemon');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config.dev');
const port = 8080;

console.log("Development server starting up!");

// Start the nodemon process for the API server.
nodemon({
  script: './server/index.js',
  watch: [
    "server/",
    "common/"
  ],
  ignore: [
    "client/",
    "static/"
  ],
  ext: 'js'
});

nodemon.on('start', function () {
  console.log('API server has started');
}).on('quit', function () {
  console.log('API server has quit');
  process.exit();
}).on('restart', function (files) {
  console.log('API server restarted due to changes in: ', files);
});

// Start the webpack-dev-server for our client code.
const server = new WebpackDevServer(webpack(config), config.devServer);

server.listen(port, 'localhost', function (err) {
  if (err) {
    console.log(err);
  }
  console.log('webpack-dev-server listening at localhost:', port);
});
