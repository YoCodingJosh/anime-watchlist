# Processor

## What is this?

A system that grabs my watchlist and downloads the anime data from MyAnimeList (through Jikan.moe).

It also performs statistics like favorite genre, favorite studio, how much have I watched total.

This is how the processor fundamentally works:

* Extracts the data from Google Sheets into JSON (in memory)
* Uses info from JSON to scan MyAnimeList for matching anime metadata
* Combines my metadata (like rating, current episode, thoughts, etc) and combines it with MAL metadata (into JSON)
* Downloads some metadata, like some anime artwork locally (to prevent too much stress on MAL)
* Puts combined data into a fat JSON file.
* ~~Uploads fat JSON to S3 (so the server can be moved/torn down without fear of data loss)~~ note: too lazy to implement right now

![NoSQL Meme](../.github/IsThisNoSQL.png?raw=true)
