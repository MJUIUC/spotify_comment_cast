const express = require("express");
const router = express.Router();
const passport = require("passport");
const SpotifyWebApi = require("spotify-web-api-node");
const date = require("date-and-time");

const scope = [
  "user-read-email",
  "user-read-private",
  "user-read-recently-played",
];

const spotifyApiClient = new SpotifyWebApi();
const clientID = "5b19527a0c314076a74849ec4f8f65ad";
const clientSecret = "f1abf24f02b944479f0df3c59266ccbf";

const {
  user: UserModel,
  userListeningHistory: UserListeningHistoryModel,
  singleDayEntry: SingleDayEntryModel,
} = require("./models");

const {
  StatisticLogHistoryModel,
  WeekHistoryModel,
} = require("./week_history_model");

const refreshTokens = async (req, res, next) => {
  try {
    if (!req.user) {
      next();
    } else {
      const { updatedAt, tokens, _id } = req.user;
      const updatedTimeInMs = new Date(updatedAt).getTime();
      const currentTime = new Date().getTime();
      if (currentTime - updatedTimeInMs > tokens.expiresIn * 1000) {
        spotifyApiClient.setRefreshToken(tokens.refreshToken);
        spotifyApiClient.setAccessToken(tokens.accessToken);
        spotifyApiClient.setClientId(clientID);
        spotifyApiClient.setClientSecret(clientSecret);
        const tokenResult = await spotifyApiClient.refreshAccessToken();
        const userToUpdate = await UserModel.findById(_id);
        userToUpdate.tokens.accessToken = tokenResult.body.access_token;
        req.user.tokens.accessToken = tokenResult.body.access_token;
        await userToUpdate.save();
      }
      next();
    }
  } catch (error) {
    console.log(error);
    next();
  }
};

router.use(refreshTokens);

router.get(
  "/app_callback/",
  passport.authenticate("spotify", { failureRedirect: "/user" }),
  async (req, res, next) => {
    const { accessToken, refreshToken, expiresIn } = req.user.tokens;
    res.redirect(
      `http://localhost:3000/app_login_callback/${accessToken}/${refreshToken}/${expiresIn}`
    );
  }
);

router.get("/end_auth_flow", async (req, res, next) => {
  res.status(200).send("you can close this window");
});

router.get(
  "/login",
  passport.authenticate("spotify", { scope, showDialog: true })
);

router.get("/logout", async (req, res, next) => {
  try {
    req.logout();
    res.status(200).send("logged out");
  } catch (error) {
    console.log(error);
  }
});

router.get("/refresh_client_tokens", async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = req.query;
    spotifyApiClient.setRefreshToken(refreshToken);
    spotifyApiClient.setAccessToken(accessToken);
    spotifyApiClient.setClientId(clientID);
    spotifyApiClient.setClientSecret(clientSecret);
    const newAccessToken = await spotifyApiClient.refreshAccessToken();
    res.status(200).send(newAccessToken);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/logged_in_user", async (req, res, next) => {
  try {
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const userProfile = await spotifyApiClient.getMe();
    res.status(200).send(userProfile);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/search_podcast", async (req, res, next) => {
  try {
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const podCastSearchResult = await spotifyApiClient.search("j", ["show"]);
    res.status(200).send(podCastSearchResult);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.get("/recent", async (req, res, next) => {
  try {
    const rightNow = new Date().getTime();
    const oneDayMs = 86400000;
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const recent_played = await spotifyApiClient.getMyRecentlyPlayedTracks({
      after: rightNow - oneDayMs,
    });
    const prettyTracks = recent_played.body.items.map((recent_track, index) => {
      const {
        disc_number,
        duration_ms,
        explicit,
        external_ids,
        external_urls,
        href,
        id,
        is_local,
        name,
        popularity,
        preview_url,
        track_number,
        type,
        uri,
      } = recent_track.track;
      return {
        track: {
          disc_number,
          duration_ms,
          explicit,
          external_ids,
          external_urls,
          href,
          id,
          is_local,
          name,
          popularity,
          preview_url,
          track_number,
          type,
          uri,
        },
        played_at: recent_track.played_at,
        item_number: index,
        readable_played_at: date.format(
          new Date(recent_track.played_at),
          "MMM D YYYY h:m:s A"
        ),
      };
    });
    res.status(200).send(prettyTracks);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

/**
 * Hydrates track data for a single day entry
 *
 * @param {*} singleDayEntryTrackArray: Array of track ID's
 * @param {*} user: user object from req session
 */
const hydrateTrackData = (singleDayEntryTrackArray, user) => {
  return Promise.all(
    singleDayEntryTrackArray.map(async (track) => {
      const { accessToken } = user.tokens;
      spotifyApiClient.setAccessToken(accessToken);
      const hydratedTrack = await spotifyApiClient.getTrack(track.id);
      return { played_at: track.played_at, track_data: hydratedTrack.body };
    })
  );
};

const lookUpSingleDayEntries = (trackHistory, user) => {
  return Promise.all(
    trackHistory.map(async (singleDayEntryId) => {
      const singleDayEntry = await SingleDayEntryModel.findById(
        singleDayEntryId
      );
      const hydratedTrackData = await hydrateTrackData(
        singleDayEntry.tracks,
        user
      );
      return {
        date: singleDayEntry.pretty_date,
        entry_number: singleDayEntry.entry_number,
        hydrated_track_data: hydratedTrackData,
      };
    })
  );
};

router.get("/history_list", async (req, res, next) => {
  try {
    const { user } = req;
    const userHistoryLog = await UserListeningHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    const hydratedUserHistory = await lookUpSingleDayEntries(
      userHistoryLog.spotify_track_history,
      user
    );
    res.status(200).send(hydratedUserHistory);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.get("/get_last_week_history", async (req, res, next) => {
  try {
    const { user } = req;
    const userStatLogs = await StatisticLogHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    const lastWeekHistogram = await WeekHistoryModel.findById(
      userStatLogs.stats_from_each_week[
        userStatLogs.stats_from_each_week.length - 1
      ]
    );
    res.status(200).send(lastWeekHistogram);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.get("/hydrate_track_from_id", async (req, res, next) => {
  try {
    const { track_id } = req.query;
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const hydratedTrack = await spotifyApiClient.getTrack(track_id);
    res.status(200).send(hydratedTrack.body);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.get("/hydrate_artist_array", async (req, res, next) => {
  try {
    const { top_five_artist } = req.query;
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const artistIdArray = top_five_artist.map((item) => {
      return JSON.parse(item).artist_id;
    });
    const hydratedArtistArray = await spotifyApiClient.getArtists(
      artistIdArray
    );
    const artistArray = top_five_artist.map((item, index) => {
      const parsedArtistObj = JSON.parse(item);
      const artist = hydratedArtistArray.body.artists[index];
      return { artist, occurances: parsedArtistObj.occurances };
    });
    res.status(200).send(artistArray);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

router.get("/hydrate_tracks_array", async (req, res, next) => {
  try {
    const { top_five_tracks } = req.query;
    const { accessToken } = req.user.tokens;
    spotifyApiClient.setAccessToken(accessToken);
    const trackIdArray = top_five_tracks.map((item) => {
      return JSON.parse(item).track_id;
    });
    const hydratedTrackArray = await spotifyApiClient.getTracks(trackIdArray);
    const trackArray = top_five_tracks.map((item, index) => {
      const parsedTrackObj = JSON.parse(item);
      const track = hydratedTrackArray.body.tracks[index];
      return { track, occurances: parsedTrackObj.occurances };
    });
    res.status(200).send(trackArray);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});


// There has to be a better way omg
const calculateTotalListeningTimeForEachArtist = async (
  user,
  trackHistogram,
  topFiveArtist
) => {
  try {
    const hydratedTracks = await Promise.all(
      trackHistogram.map(async (trackHistoObj, index) => {
        try {
          spotifyApiClient.setAccessToken(user.tokens.accessToken);
          const hydratedTrack = await spotifyApiClient.getTrack(
            trackHistoObj.track_id
          );
          return {
            track: hydratedTrack.body,
            occurances: trackHistoObj.occurances,
          };
        } catch (error) {
          console.log(error);
        }
      })
    );

    const artistHistoAndTracks = await Promise.all(topFiveArtist.map( async (artistHistoObj) => {
      const artistTracks = hydratedTracks
        .map((hydratedTrackObj) => {
          let isMatch = false;
          hydratedTrackObj.track.artists.forEach((trackArtist) => {
            if (trackArtist.id === artistHistoObj.artist_id) {
              isMatch = true;
            }
          });
          if (isMatch) {
            return {
              esitmated_play_time_per_occurance_ms:
                hydratedTrackObj.occurances *
                hydratedTrackObj.track.duration_ms,
              track_occurances: hydratedTrackObj.occurances,
              track: hydratedTrackObj.track,
            };
          } else {
            return null;
          }
        })
        .filter((item) => {
          return item === null ? false : true;
        });
      
      let total_time = 0;
      artistTracks.forEach((item) => {
        total_time += item.esitmated_play_time_per_occurance_ms; 
      });

      try {
        const hydratedArtist = await spotifyApiClient.getArtist(artistHistoObj.artist_id);
        return {
          artistHistoObj,
          artist: hydratedArtist.body,
          artistTracks,
          total_artist_listening_time_ms: total_time,
        };
      } catch (error) {
        console.log(error);
      }
    }));
    return artistHistoAndTracks;
  } catch (error) {
    console.log(error);
    return error;
  }
};

router.get("/top_five_artists_last_week", async (req, res, next) => {
  try {
    const { user } = req;
    const userStatLogs = await StatisticLogHistoryModel.findOne({
      user_mongo_id: user._id,
    });
    const lastWeekHistogram = await WeekHistoryModel.findById(
      userStatLogs.stats_from_each_week[
        userStatLogs.stats_from_each_week.length - 1
      ]
    );

    const artistWithTotalListeningTime = await calculateTotalListeningTimeForEachArtist(
      user,
      lastWeekHistogram.track_histogram,
      lastWeekHistogram.top_five.top_five_artists
    );
    res.status(200).send(artistWithTotalListeningTime);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
});

module.exports = {
  router,
};
