-- Create the Anime table
CREATE TABLE watchlist.Anime (
  -- id is an integer that matches the MyAnimeList id such as 30831 in the URL https://myanimelist.net/anime/30831/
  id INTEGER PRIMARY KEY,

  -- English title for the anime according to MyAnimeList (under the bold text)
  english_title TEXT NOT NULL,

  -- Japanese (hepburn-ized) title for the anime according to MyAnimeList (the bold text)
  japanese_title TEXT NOT NULL,
) WITHOUT ROWID; -- We don't want to have a rowid alias, since we'll be using the MAL anime id as our primary key.

