const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    comment_parent_id: {
      type: String,
    },
    comment_children_ids: {
      type: [String],
    },
    podcast_episode_id: {
      type: String,
    },
    author_id: {
      type: String,
    },
    author_name: {
      type: String,
    },
    raw_text: {
      type: String,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

const userSchema = new Schema(
  {
    spotify_id: {
      type: String,
    },
    tokens: {
      type: Object,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/**
 * Single Day data entry
 * 
 * This schema stores the tracks listened to
 * in a single day by a user. This will not
 * record all songs a user listens to, only the
 * most recent twenty.
 * 
 * As such, this will only be a sample of a users
 * daily listening habits. Given enough time, they
 * may build some significance.
 */
const singleDayEntrySchema = new Schema({
  tracks: {
    type: Array,
    default: [],
  },
  number_of_tracks: {
    type: Number,
    default: 0,
  },
  pretty_date: {
    type: String,
  },
  entry_number: {
    type: Number,
    default: 0
  },
  user_mongo_id: {
    type: String,
  }
}, {timestamps: true});

const SingleDayEntry = mongoose.model("SingleDayEntry", singleDayEntrySchema);

// Each spotify track history entry represents a pointer to one week of data
const listenHistorySchema = new Schema(
  {
    user_mongo_id: {
      type: String,
    },
    user_spotify_id: {
      type: String,
    },
    spotify_track_history: {
      type: Array,
      default: [String],
    },
  },
  { timestamps: true }
);

const UserListeningHistory = mongoose.model("UserListeningHistory", listenHistorySchema);

module.exports = {
  comment: Comment,
  user: User,
  userListeningHistory: UserListeningHistory,
  singleDayEntry: SingleDayEntry,
};
