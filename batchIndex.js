// const cron = require("node-cron");
const dateUtils = require('./app/utils/DateUtils');
const shouldProcRun = require('./app/ShouldProcessRun');
const updateTeamStats = require('./app/UpdateTeamStats');
const updateRecentGameResults = require('./app/UpdateRecentGamesResultsAndBets');
const gamesInfoUpdate = require('./app/InsertNextScheduleGames');
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
            
            gamesUpdateRes = await updateRecentGameResults.updatePrevDayGamesScore(-1);
            console.log('prev day games update result: ' + JSON.stringify(gamesUpdateRes));
            await sleep(5000);

            gamesInsertRes = await gamesInfoUpdate.insertNextDayGames(0);
            console.log('next day games insert result: ' + JSON.stringify(gamesInsertRes));
           
            console.log('********** PROCESS COMPLETE ***********');
            
            runSuccessAll = true;
        } catch (error) {
            console.log('run error: ' + error);
        }        
            shouldProcRun.insertHourlySchedRecordExternal(keys, {
                runDateString: todayString, 
                runUpdate: runSuccessAll,
                betsCalc: false,
                teamStatsUpdate: updateTeamsStatsRes,
                insertGamesResult: gamesInsertRes,
                updateGamesResult: gamesUpdateRes
          })
    }
    else {
        shouldProcRun.insertHourlySchedRecordExternal(keys, {
            runDateString: todayString, 
            runUpdate: false,
            betsCalc: false,
            teamStatsUpdate: null,
            insertGamesResult: null,
            updateGamesResult: null
      })
    }
};
start();

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve,ms)
    })
};