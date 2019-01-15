const dbFunctions = require('./app/insertNextScheduleGames');
const keys = require("./config/keys");

console.log('process.env: ' + process.env.NODE_ENV);
// dbFunctions.myTest(keys);
dbFunctions.schedTestInsert(keys);