const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
const axios = require("axios");
require("../model/Team");
require("../model/Game");
const dateUtils = require('./utils/DateUtils');
const Team = mongoose.model("teams");
const Game = mongoose.model("games");
const API_URL =
  "http://api.sportradar.us/nba/trial/v5/en/games/YEAR/MONTH/DAY/schedule.json";
const GAMES_FETCH_LIMIT = 2;

module.exports = {
  insertNextDayGames: async (keys, daysDiff) => {
    const nextDayDateParams = dateUtils.calcDayParams(daysDiff); //calcDateParams(daysDiff);
    console.log(`Games insert date: ${nextDayDateParams.day}-${nextDayDateParams.month}-${nextDayDateParams.year}`);
    let schedGamesData = await fetchGames(nextDayDateParams, keys.SPORTRADAR_API_KEY);

    if (!schedGamesData) {
      return "error fetching games for insert";
    } else {
      mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
      const dbGamesList = await apiGamesListToDbGamesList(schedGamesData.games, GAMES_FETCH_LIMIT);
      const dbSaveRes = await insertGamesBatchToDb(dbGamesList);
      if(dbSaveRes.status === 0){
        return "next day games saved";
      }
      else{
        return dbSaveRes.error;
      }
    }
},

  updatePrevDayGamesScore: async (keys, daysDiff) => {
    const prevDayDateParams = dateUtils.calcDayParams(daysDiff); // calcDateParams(daysDiff);
    console.log(`Games update scores date: ${prevDayDateParams.day}-${prevDayDateParams.month}-${prevDayDateParams.year}`);
    let schedGamesData = await fetchGames(prevDayDateParams, keys.SPORTRADAR_API_KEY);

    if (!schedGamesData) {
      return "error fetching games for update";
    } else {
      await mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
      const dbGamesList = await apiGamesListToDbGamesList(schedGamesData.games, 100);
      let updateErrorAggregation;
      let status = 0;
      let updateCount = 0;

      for (game of dbGamesList) {        
        const updateRes = await updateGameScores(game);
        if(updateRes.status === 0) {
          console.log(`** ${updateCount+1}. ${updateRes.updatedGame.srId} ${updateRes.updatedGame._id}`);
          updateCount++;
        }
        if(updateRes.status === -2){
          status = -2;
          updateErrorAggregation += ' ' + updateRes.error;
        }
      }
      if(status === 0){
        return "day games scores updated";
      }
      else{
        return updateErrorAggregation;
      }
    }
  },
}

function calcDateParams(dayDiff) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + dayDiff);
    const dd = tomorrow.getDate();
    const day = (dd < 10) ? '0' + dd : dd;
    const mm = tomorrow.getMonth() + 1; //January is 0!
    const month = (mm < 10) ? '0' + mm : mm;
    const yyyy = tomorrow.getFullYear();
    return { day: day, month: month ,year: yyyy };
}

async function fetchGames(date, apiKey) {
  const { day, month, year } = date;
  let scheduleGamesApiUrl = API_URL
    .replace("YEAR", year)
    .replace("MONTH", month)
    .replace("DAY", day);
  scheduleGamesApiUrl += "?api_key=" + apiKey;
  try {
    const response = await axios({
      url: scheduleGamesApiUrl,
      method: "GET",
      headers: {
        Accept: "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    if (response.status === 200) {
      return response.data;
    } else {
      console.log("cannot fetch games sched from api");
      return null;
    }
  } catch (error) {
    console.log('error fetching games data ' + error.message);
    return null;
  }
}

async function fetchTeamStats() {
  try {
      const dbTeamList = await Team.find({}).select('srId');
      if(dbTeamList) {
        return dbTeamList;
      }
      else {
        return { error: 'teams not found in db'}
      }
    } catch (error) {
      return { error };
    }
}

async function insertGamesBatchToDb(gamesList) {
  try {
      const saveGamesRes = await Game.create(gamesList);
      if (saveGamesRes) {
        saveGamesRes.map((game, i) => { console.log(`** ${i+1}. ${game.srId} ${game._id}`); })
        return { status: 0 };
      }
      else {
        return { status: -1, error: 'unknown server error' };
      }
    } catch (error) {
      console.log(`error.code: ${error.code} error.name: ${error.name} ` );
      return { status: -1, error: error.name };
    }
}

async function updateGameScores(game) {
  try {
    const gameUpdateRes = await Game.findOneAndUpdate({ srId: game.srId }, { $set: { results: game.results } }, { new: true });
    if (gameUpdateRes) {
      return { status: 0, updatedGame: {"_id": gameUpdateRes._id, "srId": gameUpdateRes.srId} };
    }
    else {
      return { status: -1, error: 'game not found' };
    }
  } catch (error) {
    console.log(`error.code: ${error.code} error.name: ${error.name}` );
      return { status: -2, error: error.name };
  }
}

async function apiGamesListToDbGamesList(apiGamesSched, gameCountLimit) {
  let dbGamesList = [];
  let gamesCount = 0;
  const dbTeamList = await fetchTeamStats();

  for (game of apiGamesSched) {
    if (gamesCount < gameCountLimit) {
      let homeTeamDbId, awayTeamDbId;
      for (team of dbTeamList) {
        if (game.home.sr_id === team.srId){
          homeTeamDbId = team._id;
        };
        if (game.away.sr_id === team.srId){
          awayTeamDbId = team._id;
        }
      }
      const dbGame = gameConvertApiToDb(game, homeTeamDbId, awayTeamDbId);
      dbGamesList.push(dbGame);
      gamesCount++; 
    }
  }
  return dbGamesList;
}

function gameConvertApiToDb(apiGameData, homeTeamDbId, awayTeamDbId) {
  const homePoints = apiGameData.home_points ? apiGameData.home_points : 0;
  const awayPoints = apiGameData.away_points ? apiGameData.away_points : 0;

  const game = new Game({
    srId: apiGameData.sr_id,
    srIdLong: apiGameData.id,
    schedule: apiGameData.scheduled,
    homeTeam: homeTeamDbId,
    awayTeam: awayTeamDbId,
    results: { homePoints, awayPoints }
  });
  return game;
}