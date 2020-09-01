var express = require('express');
var router = express.Router();

router.get("/", (req, res) => {
  res.setHeader("X-Control-Code", "Pepega Clap");
  res.status(418).json({ message: "wow!" }).end();
});
