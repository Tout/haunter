// TOUT Configuration
const BRAND_UID = 'e43ddc';
const LOCAL_FILES = '/videos';
const LOCAL_PAYLOAD = '/js/payload.js';

/**
 * Download the current package.json file from TOUT
 * Then download all of the videos to local disk.
 * Last write a new package.js file to load on the page.
 */
const fs = require('fs');
const get = require('lodash.get');
const download = require('download');
download(`http://platform.tout.com/sdk/v2/payload.json?brand_uid=${BRAND_UID}`).then(data => {
  try {
    const payload = JSON.parse(data.toString());
    const product = payload.products[0];  // for the example, just use the frist product.
    const touts = product.touts;

    // Create an array of urls to download.
    const urls = touts.reduce((acc, tout) => {
      const posterURL = get(tout, 'image.poster.http_url');
      const videoURL = get(tout, 'video.mp4.http_url');
      acc.push(posterURL);
      acc.push(videoURL);
      return acc;
    }, []);
    // Download everything aysnc
    Promise.all(urls.map(url => download(url, `public/${LOCAL_FILES}`))).then(() => {
      console.log('Download of videos complete', arguments);
      //TODO: Whatever you want once the download finsihes.
      //IDEA: make the payload.js here, or only start the server once the download completes.
    });


    // Update the touts array to use the new local urls
    product.touts = touts.map(tout => {
      const posterURL = get(tout, 'image.poster.http_url');
      const videoURL = get(tout, 'video.mp4.http_url');
      const posterFilename = posterURL.match(/(\w+\.\w+)$/)[0];
      const videoFilename = videoURL.match(/(\w+\.\w+)$/)[0];
      const posterLocalURL = `${LOCAL_FILES}/${posterFilename}`;
      const videoLocalURL = `${LOCAL_FILES}/${videoFilename}`;
      // Update the urls
      tout.image.poster.http_url =  posterLocalURL;
      tout.image.poster.https_url = posterLocalURL;
      tout.video.mp4.http_url = videoLocalURL;
      tout.video.mp4.https_url = videoLocalURL;
      // Remove formats we don't want to use
      delete tout.video.m3u8;
      delete tout.image.thumbnail;
      return tout;
    });

    // Override some LKQD settings to make the tag work with a native app
    product.lkqdQueryOverrides = {
      gdpr: 0, // 0 should work
      gdprcs: '', // Empty string should work
      appName: 'INSERT_YOUR_APP_NAME_HERE', //EXAMPLE: 'Izon'
      bundleId: 'INSERT_YOUR_BUNDLE_IDEA_HERE', //EXAMPLE: 'com.example.testapp'
    };

    // write the new payload.js to use.
    //NOTE: The async download most likely will not be complete by the time this runs.
    //NOTE: That's ok, the urls will match once the download finishes.
    payload.products = [product];
    // The payload is not JSON, but a thin JS wrapper
    const payloadFile = `TOUT._loadPayload(${JSON.stringify(payload)});`;
    fs.writeFile(`public/${LOCAL_PAYLOAD}`, payloadFile, (err) => {
      if (err) {
        console.error(`Error saving ${LOCAL_PAYLOAD}`, err);
        return;
      }
      // File Saved!
      console.log(`${LOCAL_PAYLOAD} updated to use local files.`);
    });
  }
  catch(e) {
    console.error('Failed to download/parse payload.json', e);
  }
})





/**
 * A simple express server to load the payload.js and video files.
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5052;

// static assests from /public
app.use('/', express.static('public'));
// allow cross origin calls
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
/**
 * Run the server
 */
app.listen(PORT, function () {
  console.log(`server 👻  listening on port ${PORT}`);
});
