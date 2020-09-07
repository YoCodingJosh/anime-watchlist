const fs = require('fs');
const drive = require("drive-db");

const jikan = require('./jikan');

const util = require('./util');

let sheetMetadata = {}

const MAX_ATTEMPTS = 3;

async function mangleSheetsData() {
  console.log("Starting processing... (this whole process may take a while due to rate limiting)");

  console.log("[Stage 1/5] Downloading spreadsheet data...");
  const _queueData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.queue_tab
  });

  const _watchedData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.watched_tab
  });

  console.log("[Stage 2/5] Computing deltas...");
  // TODO: actually implement this lol
  // my intent is not have to re-fetch info from Jikan/MAL if we don't have to (like moving anime to watched)

  let queueData = {};
  let watchedData = {};

  console.log("[Stage 3/5] Processing watch queue data...")

  // Process the queued anime.
  var queueElements = Object.entries(_queueData);
  var numTodo = 1;
  var numPending = 1;
  var totalProcessed = 0;

  console.log(`[Stage 3/5] This stage will take around ${Math.ceil((queueElements.length * 4000 + ((Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60)} minutes`);
  for (var i = 0; i < queueElements.length; i++) {
    let element = queueElements[i];

    console.log(`[Stage 3/5] Processing queued anime ${i + 1}/${queueElements.length}... ${util.round(((i + 1) / queueElements.length) * 100.0, 1)}%`);

    // We're not counting rewatch, since I use that internally as a reminder.
    if (element[1].lastepisodewatched == "REWATCH") {
      delete element;
      continue;
    }

    // If there is a comment on a TODO or a PENDING, remove it. I use that internally as part of a reminder or to provide other information.
    if ((element[1].lastepisodewatched == "TODO" || element[1].lastepisodewatched == "PENDING") && element[1].commentsthoughts != "") {
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

    element[1].malData = {};

    // Let's get to work. ^-^
    // We make a request to Jikan for the anime title (I tried to make sure all my titles were hepburnized for easier search)
    var numAttempts = 0;
    while (numAttempts < MAX_ATTEMPTS) {
      // determine if we have an axios error
      if (element[1].malData !== undefined && element[1].malData.response !== undefined) {
        console.log(`there was an error retrieving anime info, retrying again (attempt ${numAttempts + 1}/${MAX_ATTEMPTS + 1})...`);
      } else if (element[1].malData == undefined || !(Object.keys(element[1].malData).length === 0 && element[1].malData.constructor === Object)) {
        // null is fine, if we can't find the anime, but undefined means we didn't get data back, and that means we need to continue on...
        break;
      }

      // just wait a bit longer before retrying if we get an error
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 50 + 1);

      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element[1].name);
      });

      element[1].malData = malData;

      numAttempts++;
    }

    queueData[totalProcessed] = element;
    totalProcessed++;
  }

  console.log("[Stage 4/5] Processing watched list data...");

  // reset some values
  totalProcessed = 0;

  var watchedElements = Object.entries(_watchedData);
  console.log(`[Stage 4/5] This stage should take around ${Math.ceil((watchedElements.length * 4000 + ((Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60)} minutes`);

  // WE GO AGANE xqcS
  for (var i = 0; i < watchedElements.length; i++) {
    console.log(`[Stage 4/5] Processing watched anime ${i + 1}/${watchedElements.length}... ${util.round(((i + 1) / watchedElements.length) * 100.0, 1)}%`);

    let element = watchedElements[i];

    element[1].malData = {};

    var numAttempts = 0;

    while (numAttempts < MAX_ATTEMPTS) {
       // determine if we have an axios error
       if (element[1].malData !== undefined && element[1].malData.response !== undefined) {
        console.log(`there was an error retrieving anime info, retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);
      } else if (element[1].malData == undefined || !(Object.keys(element[1].malData).length === 0 && element[1].malData.constructor === Object)) {
        // null is fine, if we can't find the anime, but undefined means we didn't get data back, and that means we need to continue on...
        break;
      }

      // just wait a bit longer before retrying if we get an error
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 50 + 1);

      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element[1].name);
      });

      element[1].malData = malData;

      numAttempts++;
    }

    watchedData[totalProcessed] = element;
    totalProcessed++;
  }

  console.log("[Stage 5/5] Persisting data...");

  var combinedData = {
    ...watchedData,
    ...queueData,
  };

  fs.writeFileSync("./data/db.json", JSON.stringify(combinedData));

  console.log("all done! ^-^'")
}

async function start(sheetsInfo) {
  sheetMetadata = sheetsInfo;

  await mangleSheetsData();
}

module.exports = {
  start
};
