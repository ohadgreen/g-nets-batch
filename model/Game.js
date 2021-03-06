const mongoose = require("mongoose");
const { Schema } = mongoose;

const gameSchema = new Schema({
  srId: String,
  srIdLong: String,
  schedule: Date,
  isNewGame: Boolean,
  isRecentGame: Boolean,
  isArchiveGame: Boolean,
  playoffSeries: {
    seriesTitle: String,
    round: Number,
    status: String,
    gameTitle: String,
    homeTeamRecord: Number,
    awayTeamRecord: Number,

  },
  homeTeam: { type: Schema.Types.ObjectId, ref: 'teams' },
  awayTeam: { type: Schema.Types.ObjectId, ref: 'teams' },
  gameRank: {
    homeTeamBehindLeague: Number,
    awayTeamBehindLeague: Number,
    totalBehindLeague: Number,
    gameRank: Number
  },
  results: { homePoints: Number, awayPoints: Number },
  bets: [{
    user: { type: Schema.Types.ObjectId, ref: 'users' },
    intcode: Number,
    winner: String,
    pointsDiff: Number,
    ether: Number,
    betString: String,
    score: Number,
}],
  gameSummaryUrl: String
});

mongoose.model("games", gameSchema);
