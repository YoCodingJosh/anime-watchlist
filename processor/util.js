function delay(t, v) {
  return new Promise(function (resolve) {
    // if our timeout is zero, then immediately execute instead of waiting for the v8 event loop to pick it up.
    if (t == 0) {
      resolve.bind(null, v)();
    } else {
      setTimeout(resolve.bind(null, v), t);
    }
  });
}

function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

module.exports = {
  delay,
  round
};
