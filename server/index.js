const express = require('express');
const session = require('express-session');
const MongoSessionStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const config = require('./config');
const app = express();
const port = process.env.PORT || 8080;
const cors = require('cors');

const { router: spotifyClient } = require('./spotify');
const { user: UserModel } = require('./models');

const clientID = config.spotifyClientId;
const clientSecret = config.spotifyClientSecret;
const mongodbUrl = config.mongodbUrlLocal || config.mongodbUrl;
const mongoDebug = config.mongodbDebug;

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("debug", mongoDebug || false);

app.use(session({ 
  secret: "comment_cast",
  resave: true,
  cookie: {
    secure: false,
  },
  saveUninitialized: true,
  store: new MongoSessionStore({ mongooseConnection: mongoose.connection }),
}));
app.use(bodyParser.json({ type: 'application/*+json' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const spotifyAuth = async (accessToken, refreshToken, expires_in, profile, done) => {
  try {
    const tokens = {
      accessToken,
      refreshToken,
      expiresIn: expires_in,
    };
    const userFromDb = await UserModel.findOne({spotify_id: profile.id});
    if (!userFromDb) {
      const newUser = await UserModel.create({spotify_id: profile.id, tokens});
      await newUser.save();
      return done(null, newUser);
    } else {
      userFromDb.tokens = tokens;
      await userFromDb.save();
      return done(null, userFromDb);
    }
  } catch (error) {
    return done(error);
  }
};

passport.use(new SpotifyStrategy({
  clientID,
  clientSecret,
  callbackURL: 'http://localhost:8080/api/spotify/app_callback/',
}, spotifyAuth));

// TODO: modify cors to url when in prod
const corsConfig = {
  origin: 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsConfig));

app.use('/api/spotify', spotifyClient);

app.get('/*', (req, res, next) => {
  console.log('catch all route *');
  res.status(200).send('ok');
});

app.listen(port, () => {console.log(`Active on ${port}`)});

module.exports = { passport };
