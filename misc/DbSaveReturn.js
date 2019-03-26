const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const keys = require('../config/keys');
require("../model/Game");
require("../model/User");
const Game = mongoose.model("games");
const User = mongoose.model("users");
const contractInteration = require("../eth/contractInteraction");


async function main() {
    mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
    const gameId = 'sr:match:15330460';
    calculateBetScores(gameId, async function(res) {
        console.log('res: ' + JSON.stringify(res));
        const prizeWinners = findMaxScore(res);
        console.log('prize Winners: ' + prizeWinners);
        const txn = await contractInteration.distributePrizeToWinners(prizeWinners);
        console.log('txn: ' + JSON.stringify(txn));
    });    
}

function findMaxScore(bets) {
    let prizeWinnerCodeList = [];
      let prizeWinnerScore = 0;
      for (bet of bets) {
        // console.log(`${bet.user}- intcode: ${bet.intcode} ether: ${bet.ether} score: ${bet.score}`);
        if (bet.ether > 0 && bet.score > 0) {
          // equal score => add user to prize winners list
          if (bet.score === prizeWinnerScore) {
            prizeWinnerCodeList.push(bet.intcode);
          }
          // higher score => empty current list, add new user, update prizeScore
          if (bet.score > prizeWinnerScore) {
            prizeWinnerCodeList = [];
            prizeWinnerCodeList.push(bet.intcode);            
            // console.log(`${bet.score} > ${prizeWinnerScore} push ${bet.intcode} pwcl ${prizeWinnerCodeList}`);
            prizeWinnerScore = bet.score;
          }
        }
      }
    return prizeWinnerCodeList;
}

async function calculateBetScores(gameId, callback) {    
    await Game.findOne({ srId: gameId }).exec(function(err, game) {
        if (err) {
          console.log(err);
          return { success: false, errorMsg: `${game.srId}-${err.name} ` };
        }
        const actualWinner =
          game.results.homePoints > game.results.awayPoints
            ? "homeTeam"
            : "awayTeam";
        const actualPointsDiff = Math.abs(game.results.homePoints - game.results.awayPoints);
        
        game.bets.forEach(bet => {
          let betScore = 0;
          // calculate bet score:
          // exact match = 15, within 10 points diff range => 13 - points range
          // more than 10 points range = 2
          // wrong winner = 0
          if (bet.winner === actualWinner) {
            const pointsDiffGap = Math.abs(bet.pointsDiff - actualPointsDiff);
            if (pointsDiffGap === 0) {
              betScore = 15;
            } 
            if (pointsDiffGap <= 10) {
              betScore = 13 - pointsDiffGap;
            } else {
              betScore = 2;
            }
          }
          bet.score = betScore;
          // console.log(`winner: ${bet.winner} | bet: ${bet.betString} | score: ${betScore}`);
          // update the users collection with recent bet score
          User.findOne({ _id: mongoose.Types.ObjectId(bet.user) }, function(err, user) {
            if (err) {
              console.log(err);
              return {
                success: false,
                errorMsg: `${game.srId}- cannot update user score `
              };
            }
            let { totalBets, totalScore } = user.bets;
            totalBets++;
            totalScore += betScore;
            user.bets.totalBets = totalBets;
            user.bets.totalScore = totalScore;
            user.bets.avgScore = totalScore / totalBets;
            // console.log(`user: ${user.username} totalBets: ${totalBets}, oldTotal: ${user.bets.totalScore}, newTotal: ${totalScore}, newAvgScore: ${totalScore/totalBets}`);
            user.save();
          });
        });
        return game.save(function (err, game) {
            // console.log('after save bets:\n' + JSON.stringify(game.bets));
            return callback(game.bets);          
        });               
      });
}

main();