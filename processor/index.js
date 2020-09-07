const fs = require('fs');
const drive = require("drive-db");

const etl = require('./etl');

let sheetsInfo = {};

async function loadSheetInfo() {
  return await new Promise((resolve, reject) => {
    fs.readFile("./private/drive.json", (err, content) => {
      if (err) return reject(`Error loading google sheets data file: ${err}`);

      sheetsInfo = JSON.parse(content);

      resolve();
    });
  });
}

async function init() {
  // Load the credentials
  await loadSheetInfo().catch((err) => {
    console.error(err);

    return false;
  });

  return true;
}

async function connectToDrive() {
  // Ensure that we have connectivity to the Google Sheets document.
  const data = await drive({
    sheet: sheetsInfo.sheet
  });

  if (data == null) {
    console.error("Ensure that the document exists and that it's public.");

    return false;
  }

  return true;
}

async function main() {
  // Initialize the settings
  let initResult = await init();
  if (!initResult) {
    return;
  }

  // Warm up the cache and verify connectivity.
  let connectionResult = await connectToDrive();
  if (!connectionResult) {
    return;
  }

  // Ensure certain paths exist.
  if (!fs.existsSync("./data/images")) {
    fs.mkdirSync("./data/images");
  }

  await etl.start(sheetsInfo);

  console.log("ありがとうございます！");
}

// if running through node index.js - run the main method.
if (require.main === module) {
  main();
}

module.exports = {
  startEtl: main
};
