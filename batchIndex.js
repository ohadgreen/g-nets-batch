const cron = require("node-cron");
const schedTest = require('./app/scheduleTest');
const updateTeamStats = require('./app/updateTeamStats');
const gamesInfoUpdate = require('./app/insertNextScheduleGames');
const keys = require("./config/keys");

async function start() {
    cron.schedule("*/10 * * * *", function() {
        schedTest.asyncSaveTest(keys);
    })

   /*  console.log('********** PROCESS START ***********');
    console.log('process.env: ' + process.env.NODE_ENV + ' Time: ' + new Date());
    const updateTeamStatsInDb = await updateTeamStats.updateTeamStatsInDb(keys);
    console.log('update team stats result: ' + updateTeamStatsInDb);
    await sleep(5000);
    const nextDayGameUpdate = await gamesInfoUpdate.insertNextDayGames(keys, 1);
    console.log('next day games insert result: ' + nextDayGameUpdate);
    await sleep(5000);
    const preDayGamesUpdate = await gamesInfoUpdate.updatePrevDayGamesScore(keys, -1);
    console.log('prev day games update result: ' + preDayGamesUpdate);
    console.log('********** PROCESS COMPLETE ***********'); */
};
start();

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve,ms)
    })
};