const mongoose = require("mongoose");
const { Schema } = mongoose;

const gameSchema = new Schema({
  srId: String,
  srIdLong: String,
  schedule: Date,
  isNewGame: Boolean,
  isRecentGame: Boolean,
  isArchiveGame: Boolean,
  homeTeam: { type: Schema.Types.ObjectId, ref: "teams" },
  awayTeam: { type: Schema.Types.ObjectId, ref: "teams" },
  gameRank: {
    homeTeamBehindLeague: Number,
    awayTeamBehindLeague: Number,
    totalBehindLeague: Number,
    gameRank: Number
  },
  results: { homePoints: Number, awayPoints: Number },
  gameSummaryUrl: String
});

mongoose.model("games", gameSchema);
