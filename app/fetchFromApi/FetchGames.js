const fetch = require("./FetchFromApi");
const keys = require("../../config/keys");

module.exports = {
  fetchSchedGamesByDate: async date => {
    const { day, month, year } = date;
    let scheduleGamesApiUrl = keys.GAMES_SCHEDULE_URL
        .replace("YEAR", year)
        .replace("MONTH", month)
        .replace("DAY", day);
    scheduleGamesApiUrl += "?api_key=" + keys.SPORTRADAR_API_KEY;
    return await fetch.fetchData(scheduleGamesApiUrl);
  }
};
