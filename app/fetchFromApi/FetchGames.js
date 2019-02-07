const fetch = require("./FetchFromApi");
const keys = require("../../config/keys");
const API_URL =
  "http://api.sportradar.us/nba/trial/v5/en/games/YEAR/MONTH/DAY/schedule.json";

module.exports = {
  fetchSchedGamesByDate: async date => {
    const { day, month, year } = date;
    let scheduleGamesApiUrl = API_URL.replace("YEAR", year)
      .replace("MONTH", month)
      .replace("DAY", day);
    scheduleGamesApiUrl += "?api_key=" + keys.SPORTRADAR_API_KEY;
    return await fetch.fetchData(scheduleGamesApiUrl);
  }
};
