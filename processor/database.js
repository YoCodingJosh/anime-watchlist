const sqlite = require('sqlite3');
const sqlite3 = sqlite.verbose(); // weird vscode oddity with using typings of imported stuff

/** @type {sqlite.Database} */
let database;

function openDatabaseConnection() {
  database = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    return console.error(`unable to open/create database: ${err.message}`);
  });
}

function closeDatabaseConnection() {
  database.close((err) => {
    return console.error(`unable to close database connection: ${err.message}`);
  });
}
