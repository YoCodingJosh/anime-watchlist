// custom wrapper around jikan.moe's REST API (jikan.moe is a wrapper/cache for MyAnimeList's API and data)

// any code examples will be using this lovely anime as example - https://myanimelist.net/anime/30831/

const axios = require('axios').default;

// Set axios' default timeout to 2.5 seconds.
axios.defaults.timeout = 2500;

const util = require('./util');

const API_URL = "https://api.jikan.moe/v3";

// Jikan's default results size is too much for me.
const MAX_RESULTS = 10;

/** @returns {number} returns a whole number that represents the amount to timeout between API requests */
let getTimeoutDuration = () => Math.ceil(3400 + ((((Math.random() * 100) % 2 == 0) ? 5 : 3) * 100) + (Math.random() * 25) + (((Math.random() * 100 % 2 != 0) ? (Math.random() * 75) : (Math.random() * 30)) * (Math.random() * 25)) + 1);

/**
 * Searches MyAnimeList for an Anime by name.
 * 
 * @param {string} name - Hepburnized name for the anime (or the bold top text on the MAL listing, which is typically the Hepburnized name)
 * @returns {Object} the data object with the specified anime details
 * @returns {undeifned} if the anime couldn't be found, undefined will be returned
 * @returns {Object} if an error occurred that prevented the call to complete normally, the error will be returned.
 */
async function searchForAnime(name) {
  let searchUrl = `${API_URL}/search/anime?q=${encodeURI(name)}&limit=${MAX_RESULTS}`;

  var timeout = getTimeoutDuration();

  console.log(`[INFO] Sleeping for ${timeout} milliseconds before making request.`);

  // Jikan requires that there be 4 seconds between each request, so we sleep at least 4 seconds between each request.
  // MAL also does some sort of rate limiting for Jikan (resulting in Jikan returning a 503), so that's also why we randomize the amount to sleep between each request (so 90% it's over 4 seconds)
  return await util.delay(timeout).then(async () => {
    try {
      let res = await axios.get(searchUrl);

      // Search through the results (because sometimes the anime doesn't show up first)
      if (res.data.results === undefined) {
        throw new Error(`Got garbage from Jikan/MAL: ${res.data}`);
      }

      var results = res.data.results;
      for (var i = 0; i < results.length; i++) {
        if (results[i].title == name) {
          return results[i];
        }
      }

      console.error(`error: couldn't find the anime "${name}" ?`);

      return undefined;
    } catch (err) {
      console.error(`error: got error from Jikan/MAL: ${err}`);

      return err;
    }
  });
}

/**
 * Fetches the anime details for a given anime id 
 * @param {string} malId The MyAnimeList id
 * @returns {Object} An object containing the anime details
 * @returns {Object} If an error occurred that prevented the call to complete normally, the error will be returned.
 */
async function getAnimeDetails(malId) {
  let animeDetailsUrl = `${API_URL}/anime/${malId}`;

  var timeout = getTimeoutDuration();

  console.log(`[INFO] Sleeping for ${timeout} milliseconds before making request.`);

  return await util.delay(timeout).then(async () => {
    try {
      let res = await axios.get(animeDetailsUrl);

      return res.data;
    } catch (err) {
      console.error(`error: got error from Jikan/MAL: ${err}`);

      return err;
    }
  });
}

module.exports = {
  searchForAnime,
  getAnimeDetails
};
