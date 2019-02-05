const fs = require('fs');
require("../model/Team");
const keys = require("../config/keys");
const teamsList = require("../resources/teamsList");
const mongoose = require("mongoose");
const Team = mongoose.model("teams");
const request = require('request');

// const teamLogoBaseUrl = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/scoreboard/@@@.png&h=###';
const teamLogoBaseUrl = 'https://neulionms-a.akamaihd.net/nba/player/v3/nba/site/images/teams/@@@_p.png';
const imageSize = 70;
const downloadedImagePath = '/Users/greengo/Dev/js/projects/g-nets_batch/resources/images/teamLogos/' + imageSize + '/';

const downloadImage = function(teamName, callback){
    let fileName = downloadedImagePath + teamName + '-' + imageSize + '.png';
    let imageUri = teamLogoBaseUrl.replace('@@@', teamName.toUpperCase()); //.replace('###', imageSize);
    console.log('imageUri: ' + imageUri);
  request.head(imageUri, function(err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(imageUri).pipe(fs.createWriteStream(fileName)).on('close', callback);
  });
};

function sleep(ms){
    return new Promise(resolve => {
        setTimeout(resolve,ms)
    })
};

const updateTeamAlias = async function(team) {
    try {
        const dbUpdateRes = await Team.updateOne(
            { name: team.name },
            {
              $set: {
                alias: team.alias,
              }
            });
            (dbUpdateRes.nModified > 0) ? console.log(team.alias + ' updated') : console.log('error updating ' + team.alias);
    } catch (error) {
        console.log(error);
    }
}

async function runProc() {
    mongoose.connect(
        keys.MONGO_URI,
        { useNewUrlParser: true }
      );

    // const testTeam = {'name' : 'Cavaliers', 'alias' : 'cle'};
    for (team of teamsList) {
        downloadImage(team.alias, () => console.log(team.name + ' image downloaded'));
        // await updateTeamAlias(team);
        sleep(1500);
    }
}

runProc();