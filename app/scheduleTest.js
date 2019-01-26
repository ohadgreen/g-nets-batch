// require("dotenv").config();
const mongoose = require("mongoose");
require("../model/Game");
require("../model/SchedJobTest");
const SchedJobTest = mongoose.model("schedtest");

module.exports = {
  // test function
  myTest: () => {
    const currentTime = new Date();
    const msg = `${currentTime.getHours()}:${currentTime.getMinutes()}`;
    console.log("test: " + msg);
  },

  asyncSaveTest: async keys => {
    mongoose.connect(
      keys.MONGO_URI,
      { useNewUrlParser: true }
    );

    const currentTime = new Date();
    const msg = `${currentTime.getHours()}:${currentTime.getMinutes()} tic`;
    const schedJobTic = new SchedJobTest({
      ticTime: currentTime,
      message: msg
    });
    try {
      const saveRes = await schedJobTic.save();
      if (saveRes) {
        return "tic saved";
      } else {
        return "db error";
      }
    } catch (err) {
      return err.code;
    }
  },

  insertToDb: () => {
    // make a connection
    mongoose.connect(process.env.DB_CONN);
    const db = mongoose.connection;

    db.on("error", console.error.bind(console, "connection error:"));

    db.once("open", function() {
      console.log("Connection Successful!");

      var today = new Date();
      var tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      // a document instance
      const gameSched = new GameSchedule({
        gameDate: tomorrow,
        homeTeamName: "LA Lakers",
        homeTeamId: "1234",
        awayTeamName: "Sacramento Kings",
        awayTeamId: "4567"
      });

      // save model to database
      gameSched.save(function(err, gameSched) {
        if (err) return console.error(err);
        console.log(
          `game between ${gameSched.homeTeamName} and ${
            gameSched.awayTeamName
          } saved`
        );
      });
    });
  }
};
