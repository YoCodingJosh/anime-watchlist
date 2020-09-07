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

  var data;
  await util.delay(4000).then(axios.get(searchUrl).then(function (response) {
    var results = response.data.results;
    for (var i = 0; i < results.length; i++) {
      if (results[i].title == name) {
        data = results[i];
        return;
      }
    }
    data = null;
  }).catch(function (error) {
    data = error;
  }));

  return data;
}

module.exports = {
  searchForAnime
};
