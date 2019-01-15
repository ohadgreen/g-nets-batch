const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameScheduleSchema = new Schema({
    gameDate: Date,
    homeTeamName: String,
    homeTeamId: String,
    awayTeamName: String,
    awayTeamId: String
});
mongoose.model('game-schedules', gameScheduleSchema);