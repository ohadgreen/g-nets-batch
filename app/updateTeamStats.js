const mongoose = require("mongoose");
const axios = require("axios");
require("../model/Team");
const Team = mongoose.model("teams");
const YEAR = 2018;
const SEASON_TYPE = 'REG';
const API_URL =
  "http://api.sportradar.us/nba/trial/v5/en/seasons/YEAR/SEASON_TYPE/standings.json";

module.exports = {
  updateTeamStatsInDb: async keys => {
    let newTeamDataFromApi = await fetchTeamStatsFromApi(keys.SPORTRADAR_API_KEY);

    if (newTeamDataFromApi) {
      const teamListUpdatedData = apiToDbTeamList(newTeamDataFromApi.conferences);
      let errorResults = [];
      let teamCount = 0;

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
              gamesBehind: {
                league: newTeamData.gamesBehind.league,
                conference: newTeamData.gamesBehind.conference,
                division: newTeamData.gamesBehind.division
              }
            }
          }
        );
        if(updateRes.ok === 1){
            teamCount++;
        }
        else {
          errorResults.push({ teamName: newTeamData.name, result: updateRes })
      }
      }
      if (errorResults.length === 0) {
        return 'update complete for ' +teamCount + ' teams';
      }
      else {
          return errorResults;
      }
    }
  }
};

  async function fetchTeamStatsFromApi(apiKey) {
    let scheduleGamesApiUrl = API_URL.replace("YEAR", YEAR).replace("SEASON_TYPE", SEASON_TYPE);
      scheduleGamesApiUrl += "?api_key=" + apiKey;
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
        console.log("cannot fetch team stats from api");
        return null;
      }
  };

  function apiToDbTeamList(apiData) {
    let confName, divisionName;
    let dbTeamsList = [];
    for (conference of apiData) {
      confName = conference.name;
      for (division of conference.divisions) {
        divisionName = division.name;
        for (team of division.teams) {
          dbTeamsList.push(
            convertApiTeamToDbTeam(team, confName, divisionName)
          );
        }
      }
    }
    return dbTeamsList;
  };

  function convertApiTeamToDbTeam (apiTeam, confName, divisionName) {
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
      pointsDiff: apiTeam.points_diff,
      gamesBehind: {
        league: apiTeam.games_behind.league,
        conference: apiTeam.games_behind.conference,
        division: apiTeam.games_behind.division
      }
    });
    return team;
  };
