// const cron = require("node-cron");
const dateUtils = require('./app/utils/DateUtils');
const sleepFunc = require('./app/utils/Sleep');
const shouldProcRun = require('./app/ShouldProcessRun');
const updateTeamStats = require('./app/UpdateTeamStats');
const updateRecentGameResults = require('./app/UpdateRecentGamesResultsAndBets');
const gamesInfoUpdate = require('./app/InsertNextScheduleGames');
const keys = require("./config/keys");

async function start() {    
    const todayObj = dateUtils.calcDayParams(0);
    const todayString = dateUtils.dateObjectToString(todayObj);
    console.log('*** Release notes: 19-03-17 - test prize dist transaction');
    console.log('todayString: ' + todayString);  

    const shouldRun = true; //await shouldProcRun.checkLastRunDay(keys, todayString);
    console.log('should run: ' + shouldRun);

    if(shouldRun){
        let runSuccessAll = false;
        let updateTeamsStatsRes, gamesInsertRes, gamesUpdateRes;
        try {
            console.log('********** PROCESS START ***********');
            console.log('process.env: ' + process.env.NODE_ENV + ' Time: ' + new Date());

            // updateTeamsStatsRes = await updateTeamStats.updateTeamStatsInDb(keys);
            // console.log('update team stats result: ' + JSON.stringify(updateTeamsStatsRes));
            // await sleepFunc.sleepForSeconds(5);
            
            gamesUpdateRes = await updateRecentGameResults.updatePrevDayGamesScore(-1);
            console.log('prev day games update result: ' + JSON.stringify(gamesUpdateRes));
            await sleepFunc.sleepForSeconds(5);

            // gamesInsertRes = await gamesInfoUpdate.insertNextDayGames(0);
            // console.log('next day games insert result: ' + JSON.stringify(gamesInsertRes));
           
            console.log('********** PROCESS COMPLETE ***********');
            runSuccessAll = true; 
        } catch (error) {
            console.log('run error: ' + error);
        }        
            shouldProcRun.insertHourlySchedRecordExternal(keys, {
                runDateString: todayString, 
                runUpdate: runSuccessAll,
                betsCalc: gamesUpdateRes.betsCalc,
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

// 0x7ca499ee52834bCEabb754C79B2E27146b2A9D22