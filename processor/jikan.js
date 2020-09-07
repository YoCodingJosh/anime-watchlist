// custom wrapper around jikan.moe's REST API (jikan.moe is a wrapper/cache for MyAnimeList's API and data)
// why custom?
// * jikan's api is kinda trash LULW
// * I don't want ero/hentai to show up in my list searching for Isekai Quartet. WeirdChamp
// * searching for a title returns the first result as a title that doesn't match verbatim. monkaHmm

// code examples will be using this lovely anime as example - https://myanimelist.net/anime/30831/

const axios = require('axios').default;

const util = require('./util');

const API_URL = "https://api.jikan.moe/v3";

// Jikan's default results size is wayyy too much for me.
const MAX_RESULTS = 20;

/**
 * Searches MyAnimeList for an Anime by name.
 * 
 * @param {string} name - Hepburnized name for the anime (or the bold top text on the MAL listing, which is typically the Hepburnized name)
 * @returns {Object} the data object with the specified anime details
 * @returns {null} if the anime couldn't be found, null will be returned
 */
async function searchForAnime(name) {
  let searchUrl = `${API_URL}/search/anime?q=${encodeURI(name)}&limit=${MAX_RESULTS}`;

  // Jikan requires that there be 4 seconds between each request, so we sleep at least 4 seconds between each request.
  // MAL also does some sort of rate limiting for Jikan (resulting in Jikan returning a 503), so that's also why we randomize the amount to sleep between each request (so 90% it's over 4 seconds)
  let timeoutLength = Math.ceil(3600 + ((((Math.random() * 100) % 2 == 0) ? 5 : 3) * 100) + (Math.random() * 25) + (((Math.random() * 100 % 2 != 0) ? (Math.random() * 75) : (Math.random() * 30)) * (Math.random() * 25)) + 1);

  return await util.delay(timeoutLength).then(async () => {
    try {
      let res = await axios.get(searchUrl);

      var results = res.data.results;
      for (var i = 0; i < results.length; i++) {
        if (results[i].title == name) {
          return results[i];
        }
      }

      console.error(`error: couldn't find the anime "${name}" ?`);
      return undefined;
    }
    catch (err) {
      console.error(`error: got error from Jikan/MAL: ${err}`);
      return err;
    }
  });
}

module.exports = {
  searchForAnime
};
