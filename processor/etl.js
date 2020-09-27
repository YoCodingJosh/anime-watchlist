const fs = require('fs');
const drive = require('drive-db');

const jikan = require('./jikan');

const util = require('./util');

const axios = require('axios').default;

const DATA_FILE_PATH = "./data/anime_db.json";

let sheetMetadata = {};

let isUpdate = false;

// the raw spreadsheet data
let _queueData = {};
let _watchedData = {};

// the finished product after processing
let queueData = {};
let watchedData = {};

// max attempts to try after getting an error before giving up
const MAX_ATTEMPTS = 5;

// Download the spreadsheet data from Google Sheets and converts to JSON.
async function downloadSheetsData() {
  console.log("[Stage 1/5] Downloading spreadsheet data...");

  _queueData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.queue_tab
  });

  _watchedData = await drive({
    sheet: sheetMetadata.sheet,
    tab: sheetMetadata.watched_tab
  });
}

// Compute any deltas between the existing data file and the fresh spreadsheet data.
// This way here, we only need to fetch data from Jikan/MAL when we need it.
async function computeDeltas() {
  console.log("[Stage 2/5] Computing deltas...");

  if (!fs.existsSync(DATA_FILE_PATH)) {
    console.log("[Stage 2/5] No existing data file found. Restarting from Zero...");
  } else {
    var existingData = await new Promise((resolve, reject) => {
      fs.readFile(DATA_FILE_PATH, (err, content) => {
        if (err) return reject(`Error reading data file: ${err}`);

        resolve(JSON.parse(content));
      });
    });

    // TODO: finish implementing this :^)


    for (var i = 0; i < _queueData.length; i++) {
      // Skip if it's labeled rewatch.
      if (_queueData[i].lastepisodewatched == "REWATCH") continue;

      //console.log(_queueData[i]);
    }

    isUpdate = true;
  }
}

/**
 * Downloads the anime's main art to a file called ${malId}.jpg in ./data/images
 * (this isn't in jikan.js because it's not specific to Jikan but MAL, but may be moved somewhere else?)
 * 
 * @param url - The url of the image to download.
 * @param malId - The MAL ID of the anime, we use this to normalize the file name to just the MAL ID.
 */
async function downloadAnimeArt(url, malId) {
  axios({ url, responseType: 'stream' }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(`./data/images/${malId}.jpg`)).on('finish', () => resolve()).on('error', e => reject(e));
      }),
  );
}

async function processQueue() {
  var queueElements = Object.entries(_queueData);
  var numTodo = 1;
  var numPending = 1;
  var totalProcessed = 0; // We don't use the iterator because there may be skipped items that would be counted.

  // TODO: Maybe remove elements that will be skipped to make the time more accurate?

  var estimatedTimeToComplete = Math.ceil((queueElements.length * 4100 + (2 * (Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60 * 2);

  console.log(`[Stage 3/5] Processing watch queue... (may take around ${estimatedTimeToComplete} minutes)`);

  for (var i = 0; i < queueElements.length; i++) {
    let element = queueElements[i][1];

    // We're not counting rewatch, since I use that internally as a reminder.
    if (element.lastepisodewatched == "REWATCH") {
      console.log(`[Stage 3/5] Skipping ${i + 1} because it is labeled as REWATCH.`);
      delete element;
      continue;
    }

    // If there is a comment on a TODO or a PENDING, remove it. I use that internally as part of a reminder or to provide other information.
    if ((element.lastepisodewatched == "TODO" || element.lastepisodewatched == "PENDING") && element.commentsthoughts != "") {
      element.commentsthoughts = "";
    }

    // We create a "psuedo" queue built on the oridinal positioning in the Google Sheet.
    // In my spreadsheet, it's not guaranteed to be categorized in order by priority - it may be scattered (just like my brain! lmao)
    if (element.lastepisodewatched == "PENDING") {
      element.position = numPending;

      numPending++;
    }
    if (element.lastepisodewatched == "TODO") {
      element.position = numTodo;

      numTodo++;
    }

    console.log(`[Stage 3/5] Processing queued anime (${element.name}) ${i + 1}/${queueElements.length}... ${util.round(((i + 1) / queueElements.length) * 100.0, 1)}%`);

    // Initialize to empty.
    element.mal_data = {};
    element.additional_mal_data = {};

    var numAttempts = 0;

    // Search and fetch the basic anime details.
    while (numAttempts <= MAX_ATTEMPTS) {
      // Let's get to work. ^-^

      // Wait between retries to see if Jikan's cache expires or the error resolves itself lmao.
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      // We make a request to Jikan for the anime title (Make sure your anime titles are hepburnized or search on a different attribute like english title)
      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element.name);
      });

      if (malData == undefined) {
        console.error("[Stage 3/5] Couldn't find anime. Make sure anime is spelled correctly according to MAL!");
        element.mal_data = undefined; // short-circuit the logic so we can skip additional processing
        break;
      } else if (malData instanceof Error) { // Axios uses standard ES5 Error object.
        console.warn(`[Stage 3/5] There was an error retrieving anime info (${element.name}), retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);

        numAttempts++;

        if (numAttempts >= MAX_ATTEMPTS) {
          console.error(`ALERT!: unable to resolve error with Jikan/MAL for anime #${i + 1} (${element.name})`);
          element.mal_data = null;
          break;
        }

        // WE GO AGANE xqcS
        continue;
      } else {
        element.mal_data = malData;

        // Let's finish processing the anime.
        break;
      }
    }

    // Since we didn't quite get the anime result, we have to skip and go on to the next one.
    if (element.mal_data == null || element.mal_data == undefined) {
      console.warn("[WARNING] Since there was an error, continued processing for this anime will be skipped.");

      continue;
    }

    console.log("[Stage 3/5] Downloading anime art...");

    // Download anime art/thumbnail/poster from MAL.
    await downloadAnimeArt(element.mal_data.image_url, element.mal_data.mal_id);

    // Reset attempt counter.
    numAttempts = 0;

    console.log(`[Stage 3/5] Fetching more detailed anime information for ${element.name}`);

    // Fetch the additional anime details.
    while (numAttempts <= MAX_ATTEMPTS) {
      numAttempts++;
      
      // Wait between retries to see if Jikan's cache expires or the error resolves itself lmao.
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      var malMoreData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.getAnimeDetails(element.mal_data.mal_id);
      });

      if (malMoreData instanceof Error) {
        console.warn(`[Stage 3/5] There was an error retrieving additional anime details (${element.name}), retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);

        if (numAttempts >= MAX_ATTEMPTS) {
          console.error(`ALERT!: (additional anime details) unable to resolve error with Jikan/MAL for anime #${i + 1} (${element.name})`);
          element.mal_data = {};
          break;
        }

        continue;
      } else {
        element.additional_mal_data = malMoreData;

        break;
      }
    }

    if (element.additional_mal_data == null) {
      console.warn("[WARNING] Since there was an error, this anime won't have accurate data.");
    } else {
      element.mal_data_last_fetched = Math.floor(new Date() / 1000);
    }

    queueData[totalProcessed] = element;

    totalProcessed++;
  }
}

// TODO: Refactor since it's very similar to processQueue?
async function processWatched() {
  var watchedElements = Object.entries(_watchedData);

  var estimatedTimeToComplete = Math.ceil((watchedElements.length * 4100 + (2 * (Math.random() * 250) * Math.random() * 10) + 1) / 1000 / 60 * 2);

  console.log(`[Stage 4/5] Processing watched list data... (may take around ${estimatedTimeToComplete} minutes)`);

  var totalProcessed = 0;

  for (var i = 0; i < watchedElements.length; i++) {
    let element = watchedElements[i][1];

    console.log(`[Stage 4/5] Processing watched anime (${element.name}) ${i + 1}/${watchedElements.length}... ${util.round(((i + 1) / watchedElements.length) * 100.0, 1)}%`);

    // Initialize to empty.
    element.mal_data = {};
    element.additional_mal_data = {};

    var numAttempts = 0;

    // Search and fetch the basic anime details.
    while (numAttempts <= MAX_ATTEMPTS) {
      // Wait between retries to see if Jikan's cache expires or the error resolves itself lmao.
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      // We make a request to Jikan for the anime title (Make sure your anime titles are hepburnized or search on a different attribute like english title)
      var malData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.searchForAnime(element.name);
      });

      if (malData == undefined) {
        console.error("[Stage 4/5] Couldn't find anime. Make sure anime is spelled correctly according to MAL!");
        element.mal_data = undefined;
        break;
      } else if (malData instanceof Error) { // Axios uses standard ES5 Error object.
        console.warn(`[Stage 4/5] There was an error retrieving anime info (${element.name}), retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);

        numAttempts++;

        if (numAttempts >= MAX_ATTEMPTS) {
          console.error(`ALERT!: unable to resolve error with Jikan/MAL for anime #${i + 1} (${element.name})`);
          element.mal_data = null;
          break;
        }

        continue;
      } else {
        element.mal_data = malData;

        // Let's finish processing the anime.
        break;
      }
    }

    // Since we didn't quite get the anime result, we have to skip and go on to the next one.
    if (element.mal_data == null || element.mal_data == undefined) {
      console.warn("[WARNING] Since there was an error, continued processing for this anime will be skipped.");

      continue;
    }

    console.log("[Stage 4/5] Downloading anime art...");

    // Download anime art/thumbnail/poster from MAL.
    await downloadAnimeArt(element.mal_data.image_url, element.mal_data.mal_id);

    // Reset attempt counter.
    numAttempts = 0;

    console.log(`[Stage 4/5] Fetching more detailed anime information for ${element.name}`);

    // Fetch the additional anime details.
    while (numAttempts <= MAX_ATTEMPTS) {
      numAttempts++;
      
      // Wait between retries to see if Jikan's cache expires or the error resolves itself lmao.
      let retryTimeoutLength = Math.floor(numAttempts * ((Math.random() * 25) * Math.random() * 5) * 69 + (numAttempts * numAttempts));

      var malMoreData = await util.delay(retryTimeoutLength).then(async () => {
        return await jikan.getAnimeDetails(element.mal_data.mal_id);
      });

      if (malMoreData instanceof Error) {
        console.warn(`[Stage 4/5] There was an error retrieving additional anime details (${element.name}), retrying again (attempt ${numAttempts}/${MAX_ATTEMPTS})...`);

        if (numAttempts >= MAX_ATTEMPTS) {
          console.error(`ALERT!: (additional anime details) unable to resolve error with Jikan/MAL for anime #${i + 1} (${element.name})`);
          element.mal_data = {};
          break;
        }

        continue;
      } else {
        element.additional_mal_data = malMoreData;

        break;
      }
    }

    watchedData[totalProcessed] = element;

    totalProcessed++;
  }
}

async function persistData() {
  console.log("[Stage 5/5] Persisting data...");

  var timestamp = {
    generated_on: Math.floor(new Date() / 1000),
    last_updated_on: Math.floor(new Date() / 1000)
  };

  var combinedData = {
    timestamp,
    watched: watchedData,
    queued: queueData
  };

  if (fs.existsSync(DATA_FILE_PATH)) {
    // TODO: Merge updated with existing.
  }

  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(combinedData));

  // TODO: Upload to Amazon S3
}

async function start(sheetsInfo) {
  sheetMetadata = sheetsInfo;

  // Download the Google Sheets document and convert it to JSON.
  await downloadSheetsData();

  // Process any differences between the current document and the last processed document.
  await computeDeltas();

  // Process the watching/todo queue.
  await processQueue();

  // Process the watched list.
  await processWatched();

  // Write the data out to JSON.
  await persistData();

  console.log("All done! ^-^'");
}

module.exports = {
  start
};
