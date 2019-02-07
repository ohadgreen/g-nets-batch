const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const fetchFromApi = require("./FetchFromApi");
require("../model/Team");
require("../model/Game");
require("../model/User");
const dateUtils = require("./utils/DateUtils");
const keys = require("../config/keys");
const Team = mongoose.model("teams");
const Game = mongoose.model("games");
const User = mongoose.model("users");
const API_URL =
  "http://api.sportradar.us/nba/trial/v5/en/games/YEAR/MONTH/DAY/schedule.json";

module.exports = {
  insertNextDayGames: async daysDiff => {
    let success = false;
    let errorMsg;
    let insertedGameList = [];
    // 1. calculate date
    const insertGamesDayObject = dateUtils.calcDayParams(daysDiff);
    const insertGamesDayString = dateUtils.dateObjectToString(
      insertGamesDayObject
    );
    // 2. fetch game list from api
    let schedGamesData = await fetchScheduleGamesFromApi(insertGamesDayObject);
    if (!schedGamesData.success) {
      errorMsg = schedGamesData.errorMsg;
    } else {
      mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );
      // 3. for each game find team id, calculate importance rank and transfer to db object
      let dbGamesList = await apiGamesListToDbGamesList(
        schedGamesData.apiData.games,
        true,
        false
      );
      if (dbGamesList.error) {
        errorMsg = dbGamesList.error;
      } else {
        const dbSaveRes = await insertGamesBatchToDb(dbGamesList);
        console.log("dbSaveRes: " + JSON.stringify(dbSaveRes));
        success = dbSaveRes.success;
        errorMsg = dbSaveRes.errorMsg;
        insertedGameList = dbSaveRes.insertedGameSrId;
      }
    }
    return {
      success,
      errorMsg,
      dateString: insertGamesDayString,
      gameList: insertedGameList
    };
  },

  updatePrevDayGamesScore: async daysDiff => {
    let errorMsg = "";
    let errorCount = 0;
    let updatedGameList = [];
    const updateGamesDayObject = dateUtils.calcDayParams(daysDiff);
    const updateGamesDayString = dateUtils.dateObjectToString(
      updateGamesDayObject
    );
    console.log(`Games update scores date: ${updateGamesDayString}`);
    let schedGamesData = await fetchScheduleGamesFromApi(updateGamesDayObject);

    if (!schedGamesData.success) {
      errorMsg = schedGamesData.errorMsg;
    } else {
      mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );
      let dbGamesList = await apiGamesListToDbGamesList(
        schedGamesData.apiData.games,
        false,
        true
      );
      // update prev recent games to archive
      const setRecentArchive = await Game.updateMany(
        { isRecentGame: true },
        { $set: { isRecentGame: false, isArchiveGame: true } }
      );
      if (setRecentArchive && setRecentArchive.ok !== 1) {
        console.log("setRecentArch: " + JSON.stringify(setRecentArchive));
        errorMsg = "error update recent to archive";
      }

      for (game of dbGamesList) {
        const updateRes = await updateGameScores(game);
        const updateBetScoreRes = await calculateBetScore(game);
        if (updateRes.success && updateBetScoreRes.success) {
          updatedGameList.push(updateRes.updatedGameSrId);
        } else {
          errorMsg += updateRes.errorMsg + updateBetScoreRes.errorMsg;
          errorCount++;
        }
      }
    }
    return {
      success: errorMsg === "" && errorCount === 0,
      errorMsg,
      dateString: updateGamesDayString,
      gameList: updatedGameList
    };
  }
};

async function fetchScheduleGamesFromApi(date) {
  const { day, month, year } = date;
  let scheduleGamesApiUrl = API_URL.replace("YEAR", year)
    .replace("MONTH", month)
    .replace("DAY", day);
  scheduleGamesApiUrl += "?api_key=" + keys.SPORTRADAR_API_KEY;
  return await fetchFromApi.fetchData(scheduleGamesApiUrl);
}

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

async function insertGamesBatchToDb(gamesList) {
  try {
    const saveGamesRes = await Game.create(gamesList);
    if (saveGamesRes) {
      let insertedGameSrId = [];
      saveGamesRes.map(game => insertedGameSrId.push(game.srId));
      return { success: true, errorMsg: null, insertedGameSrId };
    } else {
      return {
        success: false,
        errorMsg: "unknown server error",
        insertedGameSrId: []
      };
    }
  } catch (error) {
    console.log(`error.code: ${error.code} error.name: ${error.name} `);
    return { success: false, errorMsg: error.name, insertedGameSrId: [] };
  }
}

async function updateGameScores(game) {
  try {
    const gameUpdateRes = await Game.findOneAndUpdate(
      { srId: game.srId },
      { $set: { results: game.results, isNewGame: false, isRecentGame: true } },
      { new: true }
    );
    if (gameUpdateRes) {
      return { success: true, updatedGameSrId: gameUpdateRes.srId };
    } else {
      return { success: false, errorMsg: `${game.srId}-not found ` };
    }
  } catch (error) {
    return { success: false, errorMsg: `${game.srId}-${error.name} ` };
  }
}

async function calculateBetScore(game) {
  try {
    await Game.findOne({ srId: game.srId }).exec(function(err, game) {
      if (err) {
        console.log(err);
        return { success: false, errorMsg: `${game.srId}-${err.name} ` };
      }
      const actualWinner =
        game.results.homePoints > game.results.awayPoints
          ? "homeTeam"
          : "awayTeam";
      const actualPointsDiff = Math.abs(
        game.results.homePoints - game.results.awayPoints
      );
      let betScore = 0;
      game.bets.forEach(bet => {
        if (bet.winner === actualWinner) {
          const pointsDiffGap = Math.abs(bet.pointsDiff - actualPointsDiff);
          if (pointsDiffGap === 0) {
            // exact match
            betScore = 15;
          }
          if (pointsDiffGap <= 10) {
            betScore = 13 - pointsDiffGap;
          } else {
            betScore = 2;
          }
        }
        bet.score = betScore;

        User.findOne({ _id: mongoose.Types.ObjectId(bet.user) }, function(
          err,
          user
        ) {
          if (err) {
            console.log(err);
            return {
              success: false,
              errorMsg: `${game.srId}- cannot update user score `
            };
          }
          let { totalBets, totalScore } = user.bets;
          totalBets++;
          totalScore += betScore;
          user.bets.totalBets = totalBets;
          user.bets.totalScore = totalScore;
          user.bets.avgScore = totalScore / totalBets;
          console.log(
            `user: ${user.username} totalBets: ${totalBets}, oldTotal: ${user.bets.totalScore}, newTotal: ${totalScore}, newAvgScore: ${totalScore/totalBets}`
          );
          user.save();
        });
      });
      game.save();
    });
    return { success: true };
  } catch (error) {
    return { success: false, errorMsg: `${game.srId}-${error.name} ` };
  }
}

async function apiGamesListToDbGamesList(apiGamesSched, isNew, isRecent) {
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
      let dbGame = gameConvertApiToDb(game, isNew, isRecent);
      dbGamesList.push(dbGame);
    }
    return dbGamesList;
  } catch (error) {
    return { error };
  }
}

function gameConvertApiToDb(apiGameData, isNew, isRecent) {
  const homePoints = apiGameData.home_points ? apiGameData.home_points : 0;
  const awayPoints = apiGameData.away_points ? apiGameData.away_points : 0;

  const game = new Game({
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
  return game;
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
