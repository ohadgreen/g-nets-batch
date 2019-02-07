const mongoose = require("mongoose");
require("../../model/Team");
const Team = mongoose.model("teams");

module.exports = {
    convert: (apiTeamData, conferenceName, divisionName) => {
        return new Team({
            srId: apiTeamData.sr_id,
            city: apiTeamData.market,
            name: apiTeamData.name,
            conference: conferenceName,
            division: divisionName,
            wins: apiTeamData.wins,
            losses: apiTeamData.losses,
            winPct: apiTeamData.win_pct,
            pointsFor: apiTeamData.points_for,
            pointsAgainst: apiTeamData.points_against,
            pointsDiff: apiTeamData.point_diff,
            gamesBehind: {
              league: apiTeamData.games_behind.league,
              conference: apiTeamData.games_behind.conference,
              division: apiTeamData.games_behind.division
            }
          });
    }
}