#! /server/bin/node

/**
 *  Past Week History Job
 *
 *  written by Marcus Jefferson 8/06/2020
 *
 *  This job is responsible for building a
 *  statisitcal dataset each week of a users
 *  listening habits.
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
const {
  WeekHistoryModel,
  StatisticLogHistoryModel,
} = require("../week_history_model");

const clientID = config.spotifyClientId;
const clientSecret = config.spotifyClientSecret;
const mongodbUrl = config.mongodbUrlLocal || config.mongodbUrl;
const mongoDebug = config.mongodbDebug;

// global ass variables
const daysInAWeek = 7;
const oneWeekInms = 604800000;

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("debug", mongoDebug || false);

const spotifyApiClient = new SpotifyWebApi();

const logIntoClient = async (user) => {
  try {
    const { tokens } = user;
    spotifyApiClient.setClientId(clientID);
    spotifyApiClient.setClientSecret(clientSecret);
    spotifyApiClient.setRefreshToken(tokens.refreshToken);
    const userAccessToken = await spotifyApiClient.refreshAccessToken();
    spotifyApiClient.setAccessToken(userAccessToken.body.access_token);
    return spotifyApiClient;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Gets the last week (7 days/entries) of listening history
 */
const getLastSevenEntries = (dailyEntryHistoryArray) => {
  const lastEntryIndex = dailyEntryHistoryArray.length - 1;
  let lookupArray = [];
  try {
    for (let i = lastEntryIndex; lastEntryIndex - daysInAWeek < i; i--) {
      lookupArray.push(dailyEntryHistoryArray[i]);
    }
  } catch (error) {
    // probably not enough data. TODO: figure out how to handle
    console.log(error);
  }
  return Promise.all(
    lookupArray.map(async (latestEntryId, index) => {
      try {
        return await SingleDayEntryModel.findById(latestEntryId);
      } catch (error) {
        console.log(error);
      }
    })
  );
};

const getAllHydratedTracksForLastWeek = async (
  lastWeekOfEntries,
  customClient
) => {
  try {
    return Promise.all(
      lastWeekOfEntries.map(async (entry) => {
        try {
          return Promise.all(
            entry.tracks.map(async (track, index) => {
              try {
                await wait(index);
                const hydratedTrack = await customClient.getTrack(
                  track.track_id
                );
                const hydratedTrackBody = hydratedTrack.body;
                return {
                  played_at: track.played_at,
                  hydrated_track_data: hydratedTrackBody,
                };
              } catch (error) {
                console.log("FAILED TO HYDRATE TRACK");
                console.log(error);
              }
            })
          );
        } catch (error) {
          console.log(error);
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
};

const getTrackHistogramsForLastWeek = (hydratedTracks) => {
  let trackHistogram = []; // {track_id: String, occurances: Number}
  let albumHistogram = []; // {album_id: String, occurances: Number}
  let artistHistogram = []; // {artist_id: String, occurances: Number}
  let uniqueArtistCount = 0;
  let uniqueTrackCount = 0;
  let uniqueAlbumCount = 0;

  try {
    hydratedTracks.forEach((entry) => {
      if (entry.length === 0) {
        return;
      } else {
        entry.forEach((track) => {
          // track counts
          const trackInHistoIndex = trackHistogram.findIndex((item) => {
            return item.track_id === track.hydrated_track_data.id;
          });
          if (trackInHistoIndex === -1) {
            uniqueTrackCount += 1;
            trackHistogram.push({
              track_id: track.hydrated_track_data.id,
              occurances: 1,
            });
          } else {
            trackHistogram[trackInHistoIndex].occurances += 1;
          }

          // album counts
          const albumInHistoIndex = albumHistogram.findIndex((item) => {
            return item.album_id === track.hydrated_track_data.album.id;
          });
          if (albumInHistoIndex === -1) {
            uniqueAlbumCount += 1;
            albumHistogram.push({
              album_id: track.hydrated_track_data.album.id,
              occurances: 1,
            });
          } else {
            albumHistogram[albumInHistoIndex].occurances += 1;
          }

          // artist counts
          const artistsArray = track.hydrated_track_data.artists;
          artistsArray.forEach((artist) => {
            const artistInHistoIndex = artistHistogram.findIndex((item) => {
              return item.artist_id === artist.id;
            });
            if (artistInHistoIndex === -1) {
              uniqueArtistCount += 1;
              artistHistogram.push({
                artist_id: artist.id,
                occurances: 1,
              });
            } else {
              artistHistogram[artistInHistoIndex].occurances += 1;
            }
          });
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
  return {
    track_histogram: trackHistogram,
    album_histogram: albumHistogram,
    artist_histogram: artistHistogram,
    unique_track_count: uniqueTrackCount,
    unique_album_count: uniqueAlbumCount,
    unique_artist_count: uniqueArtistCount,
  };
};

const getAllHydratedAlbums = (albumHistogram, customClient) => {
  return Promise.all(
    albumHistogram.map(async (item) => {
      try {
        const spotifyAlbumObj = await customClient.getAlbum(item.album_id);
        return spotifyAlbumObj.body;
      } catch (error) {
        console.log(error);
      }
    })
  );
};

const getAllHydratedArtists = (artistHistogram, customClient) => {
  return Promise.all(
    artistHistogram.map(async (item, index) => {
      try {
        await wait(index);
        const spotifyArtistObj = await customClient.getArtist(item.artist_id);
        return spotifyArtistObj.body;
      } catch (error) {
        console.log(error);
      }
    })
  );
};

const getArtistGenreHistogram = (hydratedArtists) => {
  let artistGenreHistogram = []; // { genre: String, occurances: Number }
  let uniqueGenres = 0;

  hydratedArtists.forEach((artist) => {
    artist.genres.forEach((genre) => {
      const genreHistoIndex = artistGenreHistogram.findIndex((item) => {
        return item.genre === genre;
      });
      if (genreHistoIndex === -1) {
        uniqueGenres += 1;
        artistGenreHistogram.push({
          genre,
          occurances: 1,
        });
      } else {
        artistGenreHistogram[genreHistoIndex].occurances += 1;
      }
    });
  });

  return { genre_histogram: artistGenreHistogram, unique_genres: uniqueGenres };
};

const getTotalListeningTime = (hydratedTracks) => {
  let listeningTime = 0; // time in ms

  const listeningTimePerEntry = hydratedTracks.map((entry) => {
    let listeningTimePerEntry = 0;
    let playedAtTimes = [];
    try {
      entry.forEach((track) => {
        listeningTime += track.hydrated_track_data.duration_ms;
        listeningTimePerEntry += track.hydrated_track_data.duration_ms;
        const playedAtTimesIndex = playedAtTimes.findIndex((item) => {
          return item.played_at === track.played_at;
        });
        if (playedAtTimesIndex === -1) {
          playedAtTimes.push({
            played_at: track.played_at,
          });
        }
      });
    } catch (error) {
      console.log(error);
    }
    return {
      entry_listening_time: listeningTimePerEntry,
      played_at_times: playedAtTimes,
    };
  });

  return {
    total_listening_time_ms: listeningTime,
    listening_time_per_entry: listeningTimePerEntry,
  };
};

const getTopFiveEachHistogram = (trackHistogramObject, genreHistogram) => {
  trackHistogramObject.track_histogram.sort((itemA, itemB) => {
    return itemB.occurances - itemA.occurances;
  });
  trackHistogramObject.album_histogram.sort((itemA, itemB) => {
    return itemB.occurances - itemA.occurances;
  });
  trackHistogramObject.artist_histogram.sort((itemA, itemB) => {
    return itemB.occurances - itemA.occurances;
  });
  genreHistogram.genre_histogram.sort((itemA, itemB) => {
    return itemB.occurances - itemA.occurances;
  });

  let top_five_tracks = [];
  let top_five_albums = [];
  let top_five_artists = [];
  let top_five_genres = [];

  try {
    for (let i = 0; i < 5; i++) {
      top_five_tracks.push(trackHistogramObject.track_histogram[i]);
      top_five_albums.push(trackHistogramObject.album_histogram[i]);
      top_five_artists.push(trackHistogramObject.artist_histogram[i]);
      top_five_genres.push(genreHistogram.genre_histogram[i]);
    }
  } catch (error) {
    console.log(error);
  }

  return {
    top_five_tracks,
    top_five_albums,
    top_five_artists,
    top_five_genres,
  };
};

const storeWeekHistory = async (
  user,
  trackHistogramObject,
  genreHistogram,
  totalListeningTime,
  topFiveStats
) => {
  try {
    const newWeekOfHistoryEntry = new WeekHistoryModel({
      user_mongo_id: user._id,
      user_spotify_id: user.spotify_id,
      pretty_date: date.format(new Date(), "MMM D YYYY h:m:s A"),
      unique_track_count: trackHistogramObject.unique_track_count,
      unique_album_count: trackHistogramObject.unique_album_count,
      unique_artist_count: trackHistogramObject.unique_artist_count,
      unique_genre_count: genreHistogram.unique_genres,
      listening_time: totalListeningTime,
      top_five: topFiveStats,
      track_histogram: trackHistogramObject.track_histogram,
      album_histogram: trackHistogramObject.album_histogram,
      artist_histogram: trackHistogramObject.artist_histogram,
      genre_histogram: genreHistogram.genre_histogram,
    });
    const userStatLogHistory = await StatisticLogHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    if (!userStatLogHistory) {
      // Create new history log if none found
      const newUserStatLogHistory = new StatisticLogHistoryModel();
      newUserStatLogHistory.user_mongo_id = user._id;
      newUserStatLogHistory.user_spotify_id = user.spotify_id;
      // save the new week of history and return
      await newWeekOfHistoryEntry.save();
      newUserStatLogHistory.stats_from_each_week.push(
        newWeekOfHistoryEntry._id
      );
      newUserStatLogHistory.markModified("stats_from_each_week");
      await newUserStatLogHistory.save();
      return { result: true, message: "saved week" };
    } else {
      await newWeekOfHistoryEntry.save();
      userStatLogHistory.stats_from_each_week.push(newWeekOfHistoryEntry._id);
      userStatLogHistory.markModified("stats_from_each_week");
      await userStatLogHistory.save();
      return { result: true, message: "saved week" };
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Generates Statistics for the past week of data
 */
const checkPastWeekHistory = async (user) => {
  try {
    const customClient = await logIntoClient(user);
    const dbTrackHistory = await UserListeningHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    const lastWeekOfEntries = await getLastSevenEntries(
      dbTrackHistory.spotify_track_history
    );
    console.log({ function: "checkPastWeekHistory", message: "hydrating tracks" });
    const hydratedTracks = await getAllHydratedTracksForLastWeek(
      lastWeekOfEntries,
      customClient
    );
    console.log({ function: "checkPastWeekHistory", message: "building histograms" });
    const trackHistogramObject = await getTrackHistogramsForLastWeek(
      hydratedTracks
    );
    console.log({ function: "checkPastWeekHistory", message: "hydrating artists" });
    const hydratedArtists = await getAllHydratedArtists(
      trackHistogramObject.artist_histogram,
      customClient
    );
    console.log({ function: "checkPastWeekHistory", message: "hydrating genres" });
    const genreHistogram = getArtistGenreHistogram(hydratedArtists);
    console.log({ function: "checkPastWeekHistory", message: "calculating listening time" });
    const totalListeningTime = getTotalListeningTime(hydratedTracks);
    console.log({ function: "checkPastWeekHistory", message: "calculating top five stats" });
    const topFiveStats = getTopFiveEachHistogram(
      trackHistogramObject,
      genreHistogram
    );
    // Histograms have been sorted after this point
    console.log({ function: "checkPastWeekHistory", message: "storing history" });
    return storeWeekHistory(
      user,
      trackHistogramObject,
      genreHistogram,
      totalListeningTime,
      topFiveStats
    );
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

// check the latest log entry and skip the update if a week hasn't elapsed
// sends an error message to print as well
const skipUpdateCheck = async (user) => {
  try {
    const latestListeningHistory = await UserListeningHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    if (!latestListeningHistory)
      return {
        result: true,
        message: "skip as we haven't created any entries for this user yet",
      };
    if (latestListeningHistory.spotify_track_history.length < daysInAWeek)
      return {
        result: true,
        message: "skip as we haven't created a week of data for this user yet",
      };
    const latestStatLogEntry = await StatisticLogHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    // if there is no statistic entry, we need to create one
    if (!latestStatLogEntry)
      return {
        result: false,
        message:
          "run job if there is no statistic entry, we need to create one",
      };
    const lastModifiedTime = latestStatLogEntry.updatedAt.getTime();
    const rightNow = new Date().getTime();
    const oneWeekSinceLastEntryTime = lastModifiedTime + oneWeekInms;
    return oneWeekSinceLastEntryTime >= rightNow &&
      latestListeningHistory.spotify_track_history.length >= daysInAWeek
      ? {
          result: true,
          message:
            "skip job if a week hasn't passed or there aren't enough entries",
          entries: latestListeningHistory.spotify_track_history.length,
        }
      : {
          result: false,
          message: "run job if it has been a week and there are enough entries",
        };
  } catch (error) {
    console.log(error);
    return {
      result: true,
      message: "skip if there was an error in the check function",
    };
  }
};

const forEachUser = async () => {
  try {
    const users = await UserModel.find({});
    return Promise.all(
      users.map(async (user, index) => {
        try {
          await wait(index * 0.25);
          const skipUpdate = await skipUpdateCheck(user);
          console.log(skipUpdate);
          if (skipUpdate.result) {
            return {
              message: skipUpdate.message,
              user_mongo_id: user._id,
            };
          } else {
            // This will return a promise saying wether the history for a week was saved or not
            return checkPastWeekHistory(user);
            // TODO: Delete single day entries and remove the related pointers
          }
        } catch (error) {
          console.log(error);
        }
      })
    );
  } catch (error) {
    console.log(error);
  }
};

// Research request retries

const main = async () => {
  try {
    await forEachUser();
    mongoose.connection.close();
  } catch (error) {
    console.log(error);
  }
};

main();
