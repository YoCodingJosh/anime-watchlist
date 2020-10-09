const ONE_WEEK_IN_SECONDS = 604800;
const TWO_WEEKS_IN_SECONDS = 2 * ONE_WEEK_IN_SECONDS;

// Compute any deltas between the existing data file and the fresh spreadsheet data.
// This way here, we only need to fetch data from Jikan/MAL when we need it.
async function computeDeltas() {
  console.log("[Stage 2/5] Computing deltas...");

  if (!fs.existsSync(DATA_FILE_PATH)) {
    console.log("[Stage 2/5] No existing data file found. Restarting from Zero...");
  } else {
    console.log("[Stage 2/5] Found existing data file. Looking for differences...");

    var existingData = await new Promise((resolve, reject) => {
      fs.readFile(DATA_FILE_PATH, (err, content) => {
        if (err) return reject(`Error reading data file: ${err}`);

        resolve(JSON.parse(content));
      });
    });

    // TODO: finish implementing this :^)

    var existingQueueData = Object.entries(existingData.queued);
    // Figure out what's changed between the watched queues.
    for (var i = 0; i < _queueData.length; i++) {
      var freshQueueElement = _queueData[i];

      // Skip if it's labeled rewatch.
      if (_queueData[i].lastepisodewatched == "REWATCH") continue;

      for (var j = 0; j < existingQueueData.length; j++) {
        var existingQueueElement = existingQueueData[j][1];

        // This is a new entry to our watch queue...
        // Josh, you need to stop watching so much anime man, for pete's sake!
        if (existingQueueElement == undefined) {
          // TODO:
        }

        // We have a match based on the anime title.
        if (existingQueueElement.name == freshQueueElement.name) {
          console.log(`found a match for ${freshQueueElement.name}`);

          // Set a fresh/stale flag so we can update MAL data if necessary.
          existingQueueElement.isFreshData = existingQueueElement.mal_data_last_fetched + TWO_WEEKS_IN_SECONDS >= ((new Date()).getTime() / 1000);

          // Update with the latest info from the spreadsheet.
          // TODO:

          console.log(freshQueueElement);
          console.log(existingQueueElement);

          // Continue processing the rest of the list.
          break;
        }
      }

      // If we make it out of the existing queue data, then it's a new addition.
      // Let's add it to the existing with an "expired tag" so we can grab the data for it.
      existingQueueData.push({
        ...freshQueueElement,
        isFreshData: false
      });
    }

    // Set flag so we know if this run is a new data file or an update.
    isUpdate = true;

    exit(0); // <-- REMOVE ME
  }
}
