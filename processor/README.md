# Processor

## What is this?

This is the process that performs the following steps:

* Extracts the data from Google Sheets into JSON
* Uses info from JSON to scan MyAnimeList for matching anime metadata
* Combines my metadata (like rating, current episode, thoughts, etc) and combines it with MAL metadata (into JSON)
* Downloads some metadata, like some anime artwork to S3 (to prevent too much stress on MAL)
* Puts combined data into SQLite database (on disk)
* Uploads database to S3 (so the server can be moved/torn down without fear of data loss)
