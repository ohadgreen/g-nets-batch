const dbFunctions = require('./app/insertNextScheduleGames');

console.log('process.env: ' + process.env.NODE_ENV);
dbFunctions.myTest();
// dbFunctions.schedTestInsert();