// index.js - creates Express API server.

var express = require('express');
var http = require('http');
var path = require('path');

const PRODUCTION_MODE = (process.env.NODE_ENV == 'production');
const SERVER_PORT = 6969;

var app = express();

// If we're in dev, webpack-dev-server will serve up the static content.
if (PRODUCTION_MODE) {
  app.use(express.static('dist'));

  // Serve the index.html
  app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
  });
}

// Expose the API
app.use("/api", require("./api"));

app.listen(SERVER_PORT);
