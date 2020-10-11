const api = require('../../../processor/api');

// test endpoint
async function handler (req, res) {
  const {
    query: { animeId },
  } = req;

  let data = await api.getAnimeDetails(animeId);

  if (data === undefined) {
    res.statusCode = 404;
  } else {
    res.statusCode = 200;
  }

  res.json(data == undefined ? {} : data);
};

export default handler;
