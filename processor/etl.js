const fs = require('fs');
const drive = require('drive-db');

const jikan = require('./jikan');

const util = require('./util');

const axios = require('axios').default;

let sheetMetadata = {}

const MAX_ATTEMPTS = 5;

// this function isn't jikan-specific so i'll put it here.
// creates a file called ${malId}.jpg in ./data/images
async function downloadAnimeArt(url, malId) {
  axios({ url, responseType: 'stream' }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(`./data/images/${malId}.jpg`)).on('finish', () => resolve()).on('error', e => reject(e));
      }),
  );
}

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
  // TODO: finish implementing this lmao
  // my intent is not have to re-fetch info from Jikan/MAL if we don't have to (like moving between pending and currently watching)

  if (!fs.existsSync("./data/db.json")) {
    console.log("*info* no existing data file found. Restarting from Zero...");
  } else {
    var existingData = await new Promise((resolve, reject) => {
      fs.readFile("./data/db.json", (err, content) => {
        if (err) return reject(`Error reading data file: ${err}`);
  
        resolve(JSON.parse(content));
      });
    });

    // TODO:

    return;
  }

  let queueData = {};
  let watchedData = {};

  console.log("[Stage 3/5] Processing watch queue data...")

  // Process the queued anime.
  var queueElements = Object.entries(_queueData);
  var numTodo = 1;
  var numPending = 1;
  var totalProcessed = 0;

  console.log(`[Stage 3/5] This stage will take at least ${Math.ceil((queueElements.length * 4000 + ((Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60 * 2)} minutes`);
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
    element[1].mal_additional_details = {};

    // Let's get to work. ^-^
    // We make a request to Jikan for the anime title (I tried to make sure all my titles were hepburnized for easier search)
    var numAttempts = 0;
    while (numAttempts <= MAX_ATTEMPTS) {
      // determine if we have an axios error
      if (element[1].malData !== undefined && element[1].malData.response !== undefined) {
        console.log(`there was an error retrieving anime info (${element[1].name}), retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);
      } else if (element[1].malData == undefined || !(Object.keys(element[1].malData).length === 0 && element[1].malData.constructor === Object)) {
        // null is fine, if we can't find the anime, but undefined means we didn't get data back, and that means we need to continue on.

        console.log("[Stage 3/5] Downloading anime art...");

        // Let's go ahead and download the image since we know we have the proper data to do so...
        await downloadAnimeArt(element[1].malData.image_url, element[1].malData.mal_id);

        // and let's go ahead and also download the rest of the metadata for the anime.
        var numAttempts2 = 0;

        while (numAttempts2 <= MAX_ATTEMPTS) {
          // determine if we have an axios error
          if (element[1].mal_additional_details !== undefined && element[1].mal_additional_details.response !== undefined) {
            console.log(`there was an error retrieving additional anime info (${element[1].name}), retrying again (attempt ${numAttempts2}/${MAX_ATTEMPTS})...`);
          } else if (element[1].mal_additional_details == undefined || !(Object.keys(element[1].mal_additional_details).length === 0 && element[1].mal_additional_details.constructor === Object)) {
            break;
          }

          console.log(`[Stage 3/5] Fetching more detailed anime information for ${element[1].name}`);

          // just wait a bit longer before retrying if we get an error
          let retryTimeoutLength = Math.floor(numAttempts2 * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts2 * numAttempts2));

          var malMoreData = await util.delay(retryTimeoutLength).then(async () => {
            return await jikan.getAnimeDetails(element[1].malData.mal_id);
          });

          element[1].mal_additional_details = malMoreData;

          numAttempts2++;

          if (numAttempts2 > MAX_ATTEMPTS) {
            console.error(`ALERT!: (additional anime details) unable to resolve error with Jikan/MAL for anime #${i + 1} (${element[1].name})`);
          }
        }

        // go ahead and continue processing the others.
        break;
      }

      // just wait a bit longer before retrying if we get an error
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element[1].name);
      });

      // todo: only update this field when we actually get the data.
      element[1].mal_data_last_fetched = Math.floor(new Date() / 1000);

      element[1].malData = malData;

      numAttempts++;

      if (numAttempts > MAX_ATTEMPTS) {
        console.error(`ALERT!: unable to resolve error with Jikan/MAL for anime #${i + 1} (${element[1].name})`);
      }
    }

    queueData[totalProcessed] = element;
    totalProcessed++;
  }

  console.log("[Stage 4/5] Processing watched list data...");

  // reset some values
  totalProcessed = 0;

  var watchedElements = Object.entries(_watchedData);
  console.log(`[Stage 4/5] This stage should take at least ${Math.ceil((watchedElements.length * 4000 + ((Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60 * 2)} minutes`);

  // WE GO AGANE xqcS
  for (var i = 0; i < watchedElements.length; i++) {
    console.log(`[Stage 4/5] Processing watched anime ${i + 1}/${watchedElements.length}... ${util.round(((i + 1) / watchedElements.length) * 100.0, 1)}%`);

    let element = watchedElements[i];

    element[1].malData = {};
    element[1].mal_additional_details = {};

    var numAttempts = 0;

    while (numAttempts <= MAX_ATTEMPTS) {
      // determine if we have an axios error
      if (element[1].malData !== undefined && element[1].malData.response !== undefined) {
        console.log(`there was an error retrieving anime info, retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);
      } else if (element[1].malData == undefined || !(Object.keys(element[1].malData).length === 0 && element[1].malData.constructor === Object)) {
        // null is fine, if we can't find the anime, but undefined means we didn't get data back, and that means we need to continue on.

        console.log("[Stage 4/5] Downloading anime art...");

        // Let's go ahead and download the image since we know we have the proper data to do so...
        await downloadAnimeArt(element[1].malData.image_url, element[1].malData.mal_id);

        // and let's go ahead and also download the rest of the metadata for the anime.
        var numAttempts2 = 0;

        console.log(`[Stage 4/5] Fetching more detailed anime information for ${element[1].name}`);

        while (numAttempts2 <= MAX_ATTEMPTS) {
          // determine if we have an axios error
          if (element[1].mal_additional_details !== undefined && element[1].mal_additional_details.response !== undefined) {
            console.log(`there was an error retrieving anime info, retrying again (attempt ${numAttempts2}/${MAX_ATTEMPTS})...`);
          } else if (element[1].mal_additional_details == undefined || !(Object.keys(element[1].mal_additional_details).length === 0 && element[1].mal_additional_details.constructor === Object)) {
            break;
          }

          // just wait a bit longer before retrying if we get an error
          let retryTimeoutLength = Math.floor(numAttempts2 * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts2 * numAttempts2));

          var malMoreData = await util.delay(retryTimeoutLength).then(async () => {
            return await jikan.getAnimeDetails(element[1].malData.mal_id);
          });

          element[1].mal_additional_details = malMoreData;
          
          // todo: only update this field when we actually get the data.
          element[1].mal_data_last_fetched = Math.floor(new Date() / 1000);

          numAttempts2++;

          if (numAttempts2 > MAX_ATTEMPTS) {
            console.error(`ALERT!: (additional anime details) unable to resolve error with Jikan/MAL for anime #${i + 1} (${element[1].name})`);
          }
        }

        // go ahead and continue processing the others.
        break;
      }

      // just wait a bit longer before retrying if we get an error
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element[1].name);
      });

      element[1].malData = malData;

      numAttempts++;

      if (numAttempts > MAX_ATTEMPTS) {
        console.error(`ALERT!: unable to resolve error with Jikan/MAL for anime #${i + 1} (${element[1].name})`);
      }
    }

    watchedData[totalProcessed] = element;
    totalProcessed++;
  }

  console.log("[Stage 5/5] Persisting data...");

  var combinedData = {
    watched: watchedData,
    queued: queueData
  };

  fs.writeFileSync("./data/db.json", JSON.stringify(combinedData));

  console.log("all done! ^-^'");
}

async function start(sheetsInfo) {
  sheetMetadata = sheetsInfo;

  await mangleSheetsData();
}

module.exports = {
  start
};
