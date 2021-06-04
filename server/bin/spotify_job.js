#! /server/bin/node

/**
 *  Spotify Track Job
 *  written by Marcus Jefferson 7/13/2020
 *
 *  This job is responsible for creating history
 *  entries of recently played music from spotify
 *  accounts. It will be scheduled to run once every
 *  24 hours and record up to the last 20 tracks a user
 *  has listened to in that day.
 *
 */
const SpotifyWebApi = require("spotify-web-api-node");
const mongoose = require("mongoose");
const date = require("date-and-time");
const config = require("../config");
const {
  user: UserModel,
  userListeningHistory: UserListeningHistoryModel,
  singleDayEntry: SingleDayEntryModel,
} = require("../models");

const clientID = config.spotifyClientId;
const clientSecret = config.spotifyClientSecret;
const mongodbUrl = config.mongodbUrlLocal || config.mongodbUrl;
const mongoDebug = config.mongodbDebug;

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("debug", mongoDebug || false);

const spotifyApiClient = new SpotifyWebApi();

const logIntoClient = async (user) => {
  const { tokens } = user;
  spotifyApiClient.setClientId(clientID);
  spotifyApiClient.setClientSecret(clientSecret);
  spotifyApiClient.setRefreshToken(tokens.refreshToken);
  const userAccessToken = await spotifyApiClient.refreshAccessToken();
  spotifyApiClient.setAccessToken(userAccessToken.body.access_token);
  return spotifyApiClient;
};

const prettifyTracksFromSpotify = async (spotifyTrackItemArray) => {
  try {
    if (spotifyTrackItemArray.length === 0) {
      return [];
    } else {
      return spotifyTrackItemArray.map((trackItem) => {
        const { track } = trackItem;
        delete track.artists;
        delete track.album;
        delete track.available_markets;
        return { ...track, track_id: track.id, played_at: trackItem.played_at };
      });
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Check Track History
 * 
 * Checks the track history of a
 * user and creates a new one and adds an entry
 * to it. If it already exist for a user, a new
 * entry is added to the track history array in
 * the db.
 * 
*/
const checkTrackHistory = async (user) => {
  const oneDayMs = 86400000
  try {
    const customClient = await logIntoClient(user);
    const dbTrackHistory = await UserListeningHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    const rightNow = new Date().getTime();
    const prettyDate = date.format(new Date(), "MMM D YYYY h:m:s A");
    const twentyFourHoursAgo = rightNow - oneDayMs;
    if (!dbTrackHistory) {
      const userSpotifyTrackHistory = await customClient.getMyRecentlyPlayedTracks(
        {
          after: twentyFourHoursAgo,
          limit: 50,
        }
      );
      const prettyTracks = await prettifyTracksFromSpotify(
        userSpotifyTrackHistory.body.items,
        customClient
      );
      const entry = new SingleDayEntryModel({
        tracks: prettyTracks,
        number_of_tracks: prettyTracks.length,
        pretty_date: prettyDate,
        entry_number: 1,
        user_mongo_id: user._id,
      });
      await entry.save();
      const newHistoryObject = new UserListeningHistoryModel({
        user_mongo_id: user._id,
        user_spotify_id: user.spotify_id,
        spotify_track_history: [entry._id],
      });
      await newHistoryObject.save();
    } else {
      // user tracking history object already exists
      const mostRecentEntryId =
        dbTrackHistory.spotify_track_history[
          dbTrackHistory.spotify_track_history.length - 1
        ];
      const mostRecentEntry = await SingleDayEntryModel.findById(mostRecentEntryId);
      const userSpotifyTrackHistory = await customClient.getMyRecentlyPlayedTracks(
        {
          after: twentyFourHoursAgo,
        }
      );
      const prettyTracks = await prettifyTracksFromSpotify(
        userSpotifyTrackHistory.body.items,
        customClient
      );
      const entry = new SingleDayEntryModel({
        tracks: prettyTracks,
        number_of_tracks: prettyTracks.length,
        pretty_date: prettyDate,
        entry_number: mostRecentEntry.entry_number + 1,
        user_mongo_id: user._id,
      });
      await entry.save();
      await dbTrackHistory.spotify_track_history.push(entry._id);
      dbTrackHistory.markModified('spotify_track_history');
      await dbTrackHistory.save();
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * simple wait function
 * @param {Number} time: in seconds
 */
const wait = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time * 1000);
  });
};

const forEachUser = async () => {
  try {
    const users = await UserModel.find({});
    return await Promise.all(
      users.map(async (user, index) => {
        await wait(0.2);
        return checkTrackHistory(user);
      })
    );
  } catch (error) {
    console.log(error);
  }
};

const main = async () => {
  await forEachUser();
  mongoose.connection.close();
};

main();
