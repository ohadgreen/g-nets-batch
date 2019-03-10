const mongoose = require("mongoose");
const { Schema } = mongoose;

const dailyTrackSchema = new Schema(
  {
    runDate: Date,
    runDateString: String,
    runUpdate: Boolean,
    teamStatsUpdate: {success: Boolean, errorResults: [String]},
    betsCalc: Boolean,
    prizeDistribution: String,
    insertGamesResult: {
      success: Boolean,
      errorMsg: String,
      dateString: String,
      gameList: [String]
    },
    updateGamesResult: {
      success: Boolean,
      errorMsg: String,
      dateString: String,
      gameList: [String]
    }
  },
  { collection: "dailytrack" }
);
mongoose.model("dailytrack", dailyTrackSchema);
