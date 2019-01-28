const mongoose = require('mongoose');
const { Schema } = mongoose;

const schedJobTestSchema = new Schema({ ticTime: Date, procDayString: String, message: String, runUpdate: Boolean }, { collection: 'schedtest' });
mongoose.model('schedtest', schedJobTestSchema);