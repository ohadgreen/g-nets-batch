const mongoose = require("mongoose");
const fetchFromApi = require("./fetchFromApi/FetchFromApi");
const convertApiTeamToDbTeam = require("./converters/TeamApiToDb");
const keys = require("../config/keys");
require("../model/Team");
const Team = mongoose.model("teams");

module.exports = {
  updateTeamStatsInDb: async keys => {
    let teamDataFromApi = await fetchTeamStatsFromApi();
    let errorResults = [];

    if (!teamDataFromApi.success) {
      errorResults.push(teamDataFromApi.errorMsg);
    } else {
      const teamListUpdatedData = apiToDbTeamList(
        teamDataFromApi.apiData.conferences
      );
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
              gamesBehind: newTeamData.gamesBehind
            }
          }
        );
        if (updateRes.ok !== 1) {
          errorResults.push(JSON.stringify(updateRes));
        }
      }
    }
    return { success: errorResults.length === 0, errorResults };
  }
};

async function fetchTeamStatsFromApi() {
  let teamStatsApiUrl = keys.TEAMS_INFO_URL
      .replace("YEAR", keys.SEASON_YEAR)
      .replace("SEASON_TYPE", keys.SEASON_TYPE
  );
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
          convertApiTeamToDbTeam.convert(team, confName, divisionName)
        );
      }
    }
  }
  return dbTeamsList;
}
