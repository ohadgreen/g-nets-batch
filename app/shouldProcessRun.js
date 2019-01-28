const mongoose = require("mongoose");
require("../model/SchedJobTest");
const ProcSched = mongoose.model("schedtest");

module.exports = {
  checkLastRunDay: async (keys, todayString) => {     
    mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );

    const todayProcessRan = await ProcSched.find({ procDayString : todayString, runUpdate: true });
    console.log('todayProcessRan: ' + JSON.stringify(todayProcessRan));

    if(!todayProcessRan) {
        return true;
    }
    else {
        insertHourlySchedRecord(keys, { procDayString: todayString, msg: 'no need to run', runUpdate: false });
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

      const hourlySched = new ProcSched({
        ticTime: new Date(),
        procDayString: hourlyRec.procDayString,
        message: hourlyRec.msg,
        runUpdate: hourlyRec.runUpdate
      });
      try {
        await hourlySched.save();
      } catch (err) {
        console.log('hourly record save error: ' + err);
        throw err;
      }

}
