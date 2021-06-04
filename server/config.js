const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  lastFmApiKey: process.env.LAST_FM_API_KEY,
  mongodbUrlLocal: process.env.MONGODB_URL_LOCAL,
  mongodbUrl: process.env.MONGODB_URL,
  mongodbDebug: process.env.MONGODB_DEBUG,
};
