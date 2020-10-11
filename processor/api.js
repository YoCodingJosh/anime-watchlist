// api to easily access the data from anime_db.json

const fs = require('fs');

const DATA_FILE_PATH = "./data/anime_db.json";

async function getCurrentlyQueuedAnime() {
  return await new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE_PATH, (err, content) => {
      if (err) return reject(`Error reading data file: ${err}`);

      data = JSON.parse(content);

      let result = [];
      let entries = Object.entries(data.queued);

      for (let i = 0; i < entries.length; i++) {
        var element = entries[i][1];

        // For the list, we don't want to do "information overload"
        // Just return the core info to fill out a nice results page or something like that.
        result.push({
          name: element.name,
          lastanimewatched: element.lastepisodewatched,
          commentsthoughts: element.commentsthoughts,
          mal_data: element.mal_data
        });
      }

      resolve(result);
    });
  });
}

async function getAnimeDetails(malId) {
  return await new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE_PATH, (err, content) => {
      if (err) return reject(`Error reading data file: ${err}`);

      data = JSON.parse(content);

      let watchedEntries = Object.entries(data.watched);
      let queuedEntries = Object.entries(data.queued);

      for (let i = 0; i < watchedEntries.length; i++) {
        var element = watchedEntries[i][1];

        if (element.mal_data.mal_id === malId) {
          resolve(element);
        }
      }

      for (let i = 0; i < queuedEntries.length; i++) {
        var element = queuedEntries[i][1];

        if (element.mal_data.mal_id === malId) {
          resolve(element);
        }
      }

      reject(`Unable to find MAL ID: ${malId}`);
    });
  });
}

async function getLastRefreshedTime() {
  return await new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE_PATH, (err, content) => {
      if (err) return reject(`Error reading data file: ${err}`);

      data = JSON.parse(content);

      resolve(data.timestamp.last_updated_on);
    });
  });
}

module.exports = {
  getCurrentlyQueuedAnime,
  getAnimeDetails,
  getLastRefreshedTime
};

async function test() {
  let queued = await getCurrentlyQueuedAnime();

  // should find it in the watched list (10/10 would recommend watching)
  let konosuba = await getAnimeDetails(30831);
  console.log(konosuba);
}

// if running through node api.js - run the test method.
if (require.main === module) {
  test();
}
