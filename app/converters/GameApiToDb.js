const mongoose = require("mongoose");
require("../../model/Game");
const Game = mongoose.model("games");

module.exports = {
  convert: (apiGameData, isNew, isRecent) => {
    const homePoints = apiGameData.home_points ? apiGameData.home_points : 0;
    const awayPoints = apiGameData.away_points ? apiGameData.away_points : 0;

    return new Game({
      srId: apiGameData.sr_id,
      srIdLong: apiGameData.id,
      schedule: apiGameData.scheduled,
      isNewGame: isNew,
      isRecentGame: isRecent,
      isArchiveGame: false,
      homeTeam: apiGameData.homeTeamDbId,
      awayTeam: apiGameData.awayTeamDbId,
      gameRank: {
        totalBehindLeague: apiGameData.totalBehindLeague,
        gameRank: apiGameData.gameRank
      },
      results: { homePoints, awayPoints }
    });
  }
};
