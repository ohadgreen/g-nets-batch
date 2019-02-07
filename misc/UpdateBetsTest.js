const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
require("../model/Game");
require("../model/User");
const keys = require("../config/keys");
const Game = mongoose.model("games");
const User = mongoose.model("users");

function calculateBetScore(srId) {
  mongoose.connect(
    keys.MONGO_URI,
    { useNewUrlParser: true }
  );
  try {
    Game.findOne({ srId: srId }).exec(function(err, game) {
      if (err) {
        console.log(err);
        return;
      }
      const actualWinner =
        game.results.homePoints > game.results.awayPoints
          ? "homeTeam"
          : "awayTeam";
      const actualPointsDiff = Math.abs(
        game.results.homePoints - game.results.awayPoints
      );
      console.log(JSON.stringify(game.bets));
      let betScore = 0;
      game.bets.forEach(bet => {
        console.log(`${bet.winner} - ${bet.pointsDiff}`);

        if (bet.winner === actualWinner) {
          const pointsDiffGap = Math.abs(bet.pointsDiff - actualPointsDiff);
          if (pointsDiffGap === 0) {
            // exact match
            betScore = 15;
          }
          if (pointsDiffGap <= 10) {
            betScore = 13 - pointsDiffGap;
          } else {
            betScore = 2;
          }
        }
        console.log("bet score: " + betScore);
        bet.score = betScore;
        // update total score for users
        User.findOne({ _id : mongoose.Types.ObjectId(bet.user) }, function(err, user) {
            if (err) {
                console.log(err);
                return;
              }
            console.log(`user: ${user.username} totalScore: ${user.bets.totalScore}`);
            let { totalBets, totalScore } = user.bets;
            totalBets ++;
            totalScore += betScore;
            user.bets.totalBets = totalBets;
            user.bets.totalScore = totalScore;
            user.bets.avgScore = totalScore / totalBets;
            console.log(`totalBets: ${totalBets} , totalScore: ${totalScore}, avgScore: ${totalScore}/${totalBets} `);
            user.save();
        });
      });

      //   game.save();
    });
  } catch (error) {
    console.log("run error: " + error);
  }
}

calculateBetScore("sr:match:15331184");
