const schedTest = require('./app/scheduleTest');
const updateTeamStats = require('./app/updateTeamStats');
const gamesInfoUpdate = require('./app/insertNextScheduleGames');
const keys = require("./config/keys");

async function start() {
    console.log('process.env: ' + process.env.NODE_ENV);
    const updateTeamStatsInDb = await updateTeamStats.updateTeamStatsInDb(keys);
    console.log('update team stats result: ' + updateTeamStatsInDb);
    const nextDayGameUpdate = await gamesInfoUpdate.insertNextDayGames(keys);
    console.log('next day games insert result: ' + nextDayGameUpdate);
    const preDayGamesUpdate = await gamesInfoUpdate.updatePrevDayGamesScore(keys);
    console.log('prev day games update result: ' + preDayGamesUpdate);
    // process.exit(0);
};
start();