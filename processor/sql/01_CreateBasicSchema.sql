-- Create the Anime table
CREATE TABLE watchlist.Anime (
  -- id is an integer that matches the MyAnimeList id such as 30831 in the URL https://myanimelist.net/anime/30831/
  id INTEGER PRIMARY KEY,

  -- English title for the anime according to MyAnimeList (under the bold text)
  english_title TEXT NOT NULL,

  -- Japanese (hepburn-ized) title for the anime according to MyAnimeList (the bold text)
  japanese_title TEXT NOT NULL,

  -- URL to the "cover art" (I'm not sure what to call it) from MyAnimeList for the corresponding anime (we're hosting in on S3)
  art_url TEXT NOT NULL
) WITHOUT ROWID; -- We don't want to have a rowid alias, since we'll be using the MAL anime id as our primary key.

-- Create the Todo List table
CREATE TABLE watchlist.Todo (
  -- id is an integer that is just a row id (we alias the default rowid)
  id INTEGER PRIMARY KEY,

  -- anime_id is the foreign key that maps to the Anime table
  anime_id INTEGER NOT NULL,

  -- position in the todo list
  position INTEGER NOT NULL UNIQUE
); -- We use the rowid column in this column (but aliased to id)

-- Create the Pending to Watch table
CREATE TABLE watchlist.Pending (
  -- id is an integer that is just a row id (we alias the default rowid)
  id INTEGER PRIMARY KEY,

  -- anime_id is the foreign key that maps to the Anime table
  anime_id INTEGER NOT NULL,

  -- position in the pending list
  position INTEGER NOT NULL UNIQUE
); -- We use the rowid column in this column (but aliased to id)
