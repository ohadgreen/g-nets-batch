const dbFunctions = require('./app/insertNextScheduleGames');
const updateTeamStats = require('./app/updateTeamStats');
const keys = require("./config/keys");

async function start() {
    console.log('process.env: ' + process.env.NODE_ENV);
    // dbFunctions.myTest(keys);
    // const batchJob = await dbFunctions.asyncSaveTest(keys);
    const updateTeamStatsInDb = await updateTeamStats.updateTeamStatsInDb(keys);
    console.log('index: ' + updateTeamStatsInDb);
    // process.exit(0);
};

start();