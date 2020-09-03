const fs = require('fs');

const { google } = require('googleapis');

let googleAuth = require('./GoogleAuth');

let sheetsData = {};
let gauthToken = {};

async function getLastModifiedTime() {
  const drive = google.drive({ version: 'v3', gauthToken });

  return await new Promise(resolve => drive.files.get({
    fileId: sheetsData.document_id,
    fields: "modifiedTime"
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    resolve(res.data.modifiedTime);
  }));
}

/**
 * Main method for our server.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function startServer(auth) {
  gauthToken = auth;

  fs.readFile('./private/sheets.json', (err, content) => {
    if (err) return console.log('Error loading sheets data file:', err);

    sheetsData = JSON.parse(content);

    console.log(`Watchlist last modified: ${getLastModifiedTime()}`);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

googleAuth.startGoogleAuth(startServer);
