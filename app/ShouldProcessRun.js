const mongoose = require("mongoose");
require("../model/DailyTrack");
const ProcessTrack = mongoose.model("dailytrack");

module.exports = {
  // process should run only after 9am (day light saving time), then check if it didn't aleardy ran today
  checkLastRunDay: async (keys, todayString) => {     
    const hour = new Date().getHours();
    if(hour >= 5){
      mongoose.connect(keys.MONGO_URI,{ useNewUrlParser: true });
  
      const todayProcessRan = await ProcessTrack.find({ runDateString : todayString, runUpdate: true });
      if(!todayProcessRan || todayProcessRan.length === 0) {
          return true;
      }
      else {        
          return false;
      }    
    }
    else {
      return false;
    }
},

insertHourlySchedRecordExternal: async (keys, hourlyRec) => {
    await insertHourlySchedRecord(keys, hourlyRec);
},
}

async function insertHourlySchedRecord (keys, hourlyRec) {
    mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );

      const hourlySched = new ProcessTrack({
        runDate: new Date(),
        runDateString: hourlyRec.runDateString,
        runUpdate: hourlyRec.runUpdate,
        betsCalc: hourlyRec.betsCalc,
        contractTxnHash: hourlyRec.contractTxnHash,
        teamStatsUpdate: hourlyRec.teamStatsUpdate,
        insertGamesResult: hourlyRec.insertGamesResult,
        updateGamesResult: hourlyRec.updateGamesResult
      });
      try {
        await hourlySched.save();
      } catch (err) {
        console.log('hourly record save error: ' + err);
        throw err;
      }

}
