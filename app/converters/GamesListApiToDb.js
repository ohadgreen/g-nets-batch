const mongoose = require("mongoose");
require("../../model/Team");
const Team = mongoose.model("teams");
const convertApiGameToDb = require("./GameApiToDb");

// fetch teams stats, lookup each game to update team id
// calc game importance rank by total team rank

module.exports = {
  convert: async (apiGamesSched, isNew, isRecent) => {
    try {
      let dbGamesList = [];
      const dbTeamList = await fetchTeamStats();
  
      for (game of apiGamesSched) {
        let homeTeamDbId,
          awayTeamDbId,
          homeTeamBehindLeague,
          awayTeamBehindLeague;
        for (team of dbTeamList) {
          // fill home and away teams info
          if (game.home.sr_id === team.srId) {
            homeTeamDbId = team._id;
            homeTeamBehindLeague = team.gamesBehind.league;
          }
          if (game.away.sr_id === team.srId) {
            awayTeamDbId = team._id;
            awayTeamBehindLeague = team.gamesBehind.league;
          }
        }
        game["homeTeamDbId"] = homeTeamDbId;
        game["awayTeamDbId"] = awayTeamDbId;
        game["totalBehindLeague"] = homeTeamBehindLeague + awayTeamBehindLeague;
      }
  
      addImportanceRankToGameList(apiGamesSched);
      for (game of apiGamesSched) {
        let dbGame = convertApiGameToDb.convert(game, isNew, isRecent);
        dbGamesList.push(dbGame);
      }
      return dbGamesList;
    } catch (error) {
      return { error };
    }
  }
};

async function fetchTeamStats() {
    try {
      const dbTeamList = await Team.find({}).select("srId gamesBehind.league");
      if (dbTeamList) {
        return dbTeamList;
      } else {
        return { error: "teams not found in db" };
      }
    } catch (error) {
      return { error };
    }
  }

  function addImportanceRankToGameList(games) {
    const length = games.length;
    //Number of passes
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length - i - 1; j++) {
        if (games[j].totalBehindLeague > games[j + 1].totalBehindLeague) {
          const tmp = games[j];
          games[j] = games[j + 1];
          games[j + 1] = tmp;
        }
      }
    }
    for (let i = 0; i < length; i++) {
      games[i]["gameRank"] = i + 1;
    }
    return games;
  }
