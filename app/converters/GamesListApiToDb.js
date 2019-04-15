const mongoose = require("mongoose");
require("../../model/Team");
const Team = mongoose.model("teams");
const convertApiGameToDb = require("./GameApiToDb");
const fetchFromApi = require("../fetchFromApi/FetchFromApi");
const keys = require("../../config/keys");
const SERIES_INFO_URL = "http://api.sportradar.us/nba/trial/v5/en/series/2018/PST/schedule.json";

// fetch teams stats, lookup each game to update team id
// calc game importance rank by total team rank
// fill playoff series info on post season

module.exports = {
  convert: async (apiGamesSched, isNew, isRecent) => {
    try {
      let dbGamesList = [];
      const dbTeamList = await fetchTeamStats();
      // needed only when season_type = 'PST' (post season AKA playoffs)
      const playoffs = keys.SEASON_TYPE === 'PST';
      const playoffSeriesInfo = playoffs ? await fetchPlayoffSeriesInfo() : {};
  
      for (game of apiGamesSched) {
        let homeTeamDbId,
          awayTeamDbId,
          homeTeamName,
          awayTeamName,
          homeTeamBehindLeague,
          awayTeamBehindLeague;
        for (team of dbTeamList) {
          // fill home and away teams info
          if (game.home.sr_id === team.srId) {
            homeTeamDbId = team._id;
            homeTeamName = team.name;
            homeTeamBehindLeague = team.gamesBehind.league;
          }
          if (game.away.sr_id === team.srId) {
            awayTeamDbId = team._id;
            awayTeamName = team.name;
            awayTeamBehindLeague = team.gamesBehind.league;
          }
        }
        game["homeTeamDbId"] = homeTeamDbId;
        game["awayTeamDbId"] = awayTeamDbId;      
        game["totalBehindLeague"] = homeTeamBehindLeague + awayTeamBehindLeague;
        // fill playoff series info
        if(playoffs){
          // console.log('playoffSeries: ' + JSON.stringify(playoffSeries));
          game["playoffSeries"] = findPlayoffInfoForGame(game, homeTeamName, awayTeamName, playoffSeriesInfo);
        }
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

function findPlayoffInfoForGame(game, homeTeamName, awayTeamName, playoffSeriesInfo) {
  let playoffSeries = {};
  for (serie of playoffSeriesInfo.apiData.series){
    if(serie.participants[0].name === homeTeamName || serie.participants[0].name === awayTeamName){
      // console.log(`${serie.participants[0].name} ${homeTeamName} ${awayTeamName}`);
      for(playoffGame of serie.games){
        if (game.sr_id === playoffGame.sr_id){
          playoffSeries["seriesTitle"] = serie.title;
          playoffSeries["round"] = serie.round;
          playoffSeries["status"] = serie.status;
          playoffSeries["gameTitle"] = playoffGame.title;
          if (homeTeamName === serie.participants[0].name){
            playoffSeries["homeTeamRecord"] = serie.participants[0].record;
            playoffSeries["awayTeamRecord"] = serie.participants[1].record;
          }
          else {
            playoffSeries["homeTeamRecord"] = serie.participants[1].record;
            playoffSeries["awayTeamRecord"] = serie.participants[0].record;
          }
        }
        break;
      }
      break;
    }          
  }
  return playoffSeries;
}

async function fetchTeamStats() {
    try {
      const dbTeamList = await Team.find({}).select("srId name gamesBehind.league");
      if (dbTeamList) {
        return dbTeamList;
      } else {
        return { error: "teams not found in db" };
      }
    } catch (error) {
      return { error };
    }
  }

  async function fetchPlayoffSeriesInfo() {
    try {
      const seriesInfo = await fetchFromApi.fetchData(`${SERIES_INFO_URL}?api_key=${keys.SPORTRADAR_API_KEY}`)
      return seriesInfo;
    }
    catch(error) {
      console.log(error);
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
