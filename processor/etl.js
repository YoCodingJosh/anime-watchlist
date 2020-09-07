const fs = require('fs');
const drive = require("drive-db");

const jikan = require('./jikan');

let sheetMetadata = {}
let queueData = {};
let watchedData = {};

async function mangleSheetsData() {
  const _queueData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.queue_tab
  });

  const _watchedData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.watched_tab
  });

  // Process the queued anime.
  var queueElements = Object.entries(_queueData);
  var numTodo = 1;
  var numPending = 1;
  for (var i = 0; i < queueElements.length; i++) {
    let element = queueElements[i];

    // We're not counting rewatch, since I use that internally as a reminder.
    if (element[1].lastepisodewatched == "REWATCH") {
      delete element;
      return;
    }

    // If there is a comment on a TODO, remove it. I use that internally as part of a reminder or to provide other information.
    if (element[1].lastepisodewatched == "TODO" && element[1].commentsthoughts != "") {
      element[1].commentsthoughts = "";
    }

    // We create a "psuedo" queue built on the oridinal positioning in the Google Sheet.
    // In my spreadsheet, it's not guaranteed to be categorized in order by priority - it may be scattered (just like my brain! lmao)
    if (element[1].lastepisodewatched == "PENDING") {
      element[1].position = numPending;

      numPending++;
    }

    if (element[1].lastepisodewatched == "TODO") {
      element[1].position = numTodo;

      numTodo++;
    }

    // Let's get to work. ^-^
    // We make a request to Jikan for the anime title (I tried to make sure all my titles were hepburnized for easier search)
    var malData = await jikan.searchForAnime(element[1].name);
    element[1].malData = malData;

    console.log(element);
  }
}

async function start(sheetsInfo) {
  sheetMetadata = sheetsInfo;

  await mangleSheetsData();
}

module.exports = {
  start
};
