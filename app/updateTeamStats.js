const mongoose = require("mongoose");
const fetchFromApi = require("./FetchFromApi");
const convertApiTeamToDbTeam = require("../app/converters/TeamApiToDb");
const keys = require("../config/keys");
require("../model/Team");
const Team = mongoose.model("teams");
const YEAR = 2018;
const SEASON_TYPE = 'REG';
const API_URL =
  "http://api.sportradar.us/nba/trial/v5/en/seasons/YEAR/SEASON_TYPE/standings.json";

module.exports = {
  updateTeamStatsInDb: async keys => {
    let teamDataFromApi = await fetchTeamStatsFromApi();
    let errorResults = [];

    if (!teamDataFromApi.success) {
      errorResults.push(teamDataFromApi.errorMsg);
    }
    else {
      const teamListUpdatedData = apiToDbTeamList(teamDataFromApi.apiData.conferences);      
      mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );
      for (newTeamData of teamListUpdatedData) {
        const updateRes = await Team.updateOne(
          { srId: newTeamData.srId },
          {
            $set: {
              wins: newTeamData.wins,
              losses: newTeamData.losses,
              winPct: newTeamData.winPct,
              pointsFor: newTeamData.pointsFor,
              pointsAgainst: newTeamData.pointsAgainst,
              pointsDiff: newTeamData.pointsDiff,
              gamesBehind: newTeamData.gamesBehind,
            }
          }
        );
        if(updateRes.ok !== 1){
          errorResults.push(JSON.stringify(updateRes));
        }        
      }      
    }
    return {success: (errorResults.length === 0), errorResults};
  }
};

async function fetchTeamStatsFromApi() {
  let teamStatsApiUrl = API_URL.replace("YEAR", YEAR).replace("SEASON_TYPE", SEASON_TYPE);
  teamStatsApiUrl += "?api_key=" + keys.SPORTRADAR_API_KEY;  
  return await fetchFromApi.fetchData(teamStatsApiUrl);
}

  function apiToDbTeamList(apiData) {
    let confName, divisionName;
    let dbTeamsList = [];
    for (conference of apiData) {
      confName = conference.name;
      for (division of conference.divisions) {
        divisionName = division.name;
        for (team of division.teams) {
          dbTeamsList.push(
            // convertApiTeamToDbTeam(team, confName, divisionName)
            convertApiTeamToDbTeam.convert(team, confName, divisionName)
          );
        }
      }
    }
    return dbTeamsList;
  };

/*   function convertApiTeamToDbTeam (apiTeam, confName, divisionName) {
    let team = new Team({
      srId: apiTeam.sr_id,
      city: apiTeam.market,
      name: apiTeam.name,
      conference: confName,
      division: divisionName,
      wins: apiTeam.wins,
      losses: apiTeam.losses,
      winPct: apiTeam.win_pct,
      pointsFor: apiTeam.points_for,
      pointsAgainst: apiTeam.points_against,
      pointsDiff: apiTeam.point_diff,
      gamesBehind: {
        league: apiTeam.games_behind.league,
        conference: apiTeam.games_behind.conference,
        division: apiTeam.games_behind.division
      }
    });
    return team;
  }; */
