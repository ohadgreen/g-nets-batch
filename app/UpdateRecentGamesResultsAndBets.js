const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
require("../model/Team");
require("../model/Game");
require("../model/User");
const dateUtils = require("./utils/DateUtils");
const fetchGamesFromApi = require("./fetchFromApi/FetchGames");
const gamesListApiToDb = require("./converters/GamesListApiToDb");
const contractInteration = require("../eth/contractInteraction");
const keys = require("../config/keys");
const Game = mongoose.model("games");
const User = mongoose.model("users");

module.exports = {
  updatePrevDayGamesScore: async daysDiff => {
    let errorMsg = '';
    let updatedGameList = [];
    let totalBetsCalcSuccess = true;
    let contractTxnHash = '';
    // 1. calculate date
    const updateGamesDayObject = dateUtils.calcDayParams(daysDiff);
    const updateGamesDayString = dateUtils.dateObjectToString(
      updateGamesDayObject
    );
    // 2. fetch game list from api
    let schedGamesData = await fetchGamesFromApi.fetchSchedGamesByDate(
      updateGamesDayObject
    );

    if (!schedGamesData.success) {
      errorMsg = schedGamesData.errorMsg;
    } else {
      mongoose.connect(keys.MONGO_URI, { useNewUrlParser: true });
      // 3. convert to db games objects with team details
      let dbGamesList = await gamesListApiToDb.convert(
        schedGamesData.apiData.games,
        false,
        true
      );
      // 4. update prev recent games to archive:true
      const setRecentArchive = await Game.updateMany(
        { isRecentGame: true },
        { $set: { isRecentGame: false, isArchiveGame: true } }
      );
      if (setRecentArchive && setRecentArchive.ok !== 1) {
        console.log("setRecentArch: " + JSON.stringify(setRecentArchive));
        errorMsg = "error update recent to archive";
      }

      for (game of dbGamesList) {
        // 5. update game results
        const updateRes = await updateGameScores(game);
        console.log('updateRes.gameSrId: ' + updateRes.updatedGameSrId);
        if(!updateRes.success){
          errorMsg += updateRes.errorMsg;
        }
        else {
          updatedGameList.push(updateRes.updatedGameSrId);
        }

        // 6. update bet scores for each user
        const updateBetScoreRes = await calculateBetScore(game);
        if(!updateBetScoreRes.success){
          errorMsg += updateBetScoreRes.errorMsg;
          totalBetsCalcSuccess = false;
        } 
        // 7. calculate prize winners, returns list of user codes for contract function
        const calcPrizeDist = await calculatePrizeDistribution(game);
        if(!calcPrizeDist.success){
          errorMsg += calcPrizeDist.errorMsg;
        } 
        console.log('prize winners: ' + calcPrizeDist.prizeWinnerCodeList);
        if (calcPrizeDist.prizeWinnerCodeList.length > 0){ 
          console.log('calling prize dist txn');         
          const contractTxnRes = await contractInteration.distributePrizeToWinners(calcPrizeDist.prizeWinnerCodeList);
          // console.log('contractRes: ' + JSON.stringify(contractTxnRes));
          if (contractTxnRes.transactionHash){
            contractTxnHash = contractTxnRes.transactionHash;
          }
          else {
            errorMsg += 'error running contract function';
          }
        }
      }
    }
    return {
      success: errorMsg === '',
      errorMsg,
      betsCalc: totalBetsCalcSuccess,
      dateString: updateGamesDayString,
      gameList: updatedGameList,
      contractTxnHash: contractTxnHash
    };
  }
};

async function calculatePrizeDistribution(game) {
  try {
    const gameBetUserCodes = await Game.findOne(
      { srId: game.srId },
      { _id: 0, bets: 1 }
    ).populate({
      path: "bets.user",
      model: "users",
      select: "username score intcode"
    });

    console.log(JSON.stringify(gameBetUserCodes));
    if (gameBetUserCodes && gameBetUserCodes.bets.length > 0) {
      let prizeWinnerCodeList = [];
      let prizeWinnerScore = 0;
      for (bet of gameBetUserCodes.bets) {
        console.log(`${bet.user.intcode}- ether: ${bet.ether} score: ${bet.score}`);
        if (bet.ether > 0 && bet.score > 0) {
          // equal score => add user to prize winners list
          if (bet.score === prizeWinnerScore) {
            prizeWinnerCodeList.push(bet.user.intcode);
          }
          // higher score => empty current list, add new user, update prizeScore
          if (bet.score > prizeWinnerScore) {
            prizeWinnerCodeList = [];
            prizeWinnerCodeList.push(bet.user.intcode);            
            console.log(`${bet.score} > ${prizeWinnerScore} push ${bet.user.intcode} pwcl ${prizeWinnerCodeList}`);
            prizeWinnerScore = bet.score;
          }
        }
      }
      return { success: true, errorMsg: null, prizeWinnerCodeList };
    }
    else {
      return { success: true, errorMsg: null, prizeWinnerCodeList: [] };
    }
  } catch (error) {
    return { success: false, errorMsg: `calc prize error ${game.srId}-not found `, prizeWinnerCodeList: [] };
  }
}

async function updateGameScores(game) {
  try {
    const gameUpdateRes = await Game.findOneAndUpdate(
      { srId: game.srId },
      { $set: { results: game.results, isNewGame: false, isRecentGame: true } },
      { new: true }
    );
    if (gameUpdateRes) {
      return { success: true, updatedGameSrId: gameUpdateRes.srId, errorMsg: null };
    } else {
      return { success: false, errorMsg: `update game score for ${game.srId}-not found ` };
    }
  } catch (error) {
    return { success: false, errorMsg: `pdate game score for ${game.srId}-${error.name} ` };
  }
}

async function calculateBetScore(game) {
  try {
    await Game.findOne({ srId: game.srId }).exec(function(err, game) {
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
        User.findOne({ _id: mongoose.Types.ObjectId(bet.user) }, function(
          err,
          user
        ) {
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
      game.save();
    });
    return { success: true, errorMsg: null };
  } catch (error) {
    console.log('catch clause');
    return { success: false, errorMsg: `${game.srId}-${error.name} ` };
  }
}
