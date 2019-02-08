const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
require("../model/Team");
require("../model/Game");
const dateUtils = require("./utils/DateUtils");
const fetchGamesFromApi = require("./fetchFromApi/FetchGames");
const gamesListApiToDb = require("./converters/GamesListApiToDb");
const keys = require("../config/keys");
const Game = mongoose.model("games");

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
    let schedGamesData = await fetchGamesFromApi.fetchSchedGamesByDate(insertGamesDayObject);
    if (!schedGamesData.success) {
      errorMsg = schedGamesData.errorMsg;
    } else {
      mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );
      // 3. for each game find team id, calculate importance rank and transfer to db object
      let dbGamesList = await gamesListApiToDb.convert(
        schedGamesData.apiData.games,
        true,
        false
      );
      if (dbGamesList.error) {
        errorMsg = dbGamesList.error;
      } else {
        // 4. save in db
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
};

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
