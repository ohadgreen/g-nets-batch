const dbFunctions = require('./app/insertNextScheduleGames');
const keys = require("./config/keys");

async function start() {
    console.log('process.env: ' + process.env.NODE_ENV);
    // dbFunctions.myTest(keys);
    const batchJob = await dbFunctions.asyncSaveTest(keys);
    console.log('index: ' + batchJob);
    process.exit(0);
};

start();