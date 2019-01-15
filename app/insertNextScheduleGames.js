require("dotenv").config();
const mongoose = require("mongoose");
require("../model/GameSchedule");
require("../model/SchedJobTest");
const GameSchedule = mongoose.model("game-schedules");
const SchedJobTest = mongoose.model("schedtest");

module.exports = {
  // test function
  myTest: () => {
    console.log("my test");
  },

  schedTestInsert: () => {
    mongoose.connect(process.env.DB_CONN);
    const db = mongoose.connection;
    db.once("open", function() {

    const currentTime = new Date();
    const msg = `${currentTime.getHours()}:${currentTime.getMinutes()} tic`;

    const schedJobTic = new SchedJobTest({ ticTime: currentTime, message: msg });
    schedJobTic.save(function(err, tic) {
      if (err) return handleError(err);
      console.log(`${tic.message} saved`);
    });
  });
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
