// const cron = require("node-cron");
// const schedTest = require('./misc/ScheduleTest');
const dateUtils = require('./app/utils/DateUtils');
const shouldProcRun = require('./app/shouldProcessRun');
const updateTeamStats = require('./app/updateTeamStats');
const gamesInfoUpdate = require('./app/insertNextScheduleGames');
const keys = require("./config/keys");

async function start() {    
    const todayObj = dateUtils.calcDayParams(0);
    const todayString = dateUtils.dateObjectToString(todayObj);
    console.log('todayString: ' + todayString);  

    const shouldRun = await shouldProcRun.checkLastRunDay(keys, todayString);
    console.log('should run: ' + shouldRun);

    if(shouldRun){
        let runSuccessAll = false;
        let updateTeamsStatsRes, gamesInsertRes, gamesUpdateRes;
        try {
            console.log('********** PROCESS START ***********');
            console.log('process.env: ' + process.env.NODE_ENV + ' Time: ' + new Date());
            updateTeamsStatsRes = await updateTeamStats.updateTeamStatsInDb(keys);
            console.log('update team stats result: ' + JSON.stringify(updateTeamsStatsRes));
            await sleep(5000);
            gamesInsertRes = await gamesInfoUpdate.insertNextDayGames(1);
            console.log('next day games insert result: ' + JSON.stringify(gamesInsertRes));
            await sleep(5000);
            gamesUpdateRes = await gamesInfoUpdate.updatePrevDayGamesScore(-1);
            console.log('prev day games update result: ' + JSON.stringify(gamesUpdateRes));
            console.log('********** PROCESS COMPLETE ***********');
            
            runSuccessAll = true;
        } catch (error) {
            console.log('run error: ' + error);
        }        
            shouldProcRun.insertHourlySchedRecordExternal(keys, {
                procDayString: todayString, 
                runUpdate: runSuccessAll,
                betsCalc: false,
                teamStatsUpdate: updateTeamsStatsRes,
                insertGamesResult: gamesInsertRes,
                updateGamesResult: gamesUpdateRes
          })
    }
};
start();

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve,ms)
    })
};