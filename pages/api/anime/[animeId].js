// test endpoint
export default (req, res) => {
  const {
    query: { animeId },
  } = req;
  
  res.statusCode = 200
  res.json({ message: `Anime ID: ${animeId}` })
}
