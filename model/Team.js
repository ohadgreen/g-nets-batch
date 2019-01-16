const mongoose = require('mongoose');
const { Schema } = mongoose;

const teamSchema = new Schema({
    srId: String,
    city: String,
    name: String,
    alias: String,
    teamPageUrl: String,
    conference: String,
    division: String,
    wins: Number,
    losses: Number,
    winPct: Number,
    pointsFor: Number,
    pointsAgainst: Number,
    pointsDiff: Number,
    gamesBehind: {
    league: Number,
    conference: Number,
    division: Number,
    }
});

mongoose.model('teams', teamSchema);