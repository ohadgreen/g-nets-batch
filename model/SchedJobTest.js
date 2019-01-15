const mongoose = require('mongoose');
const { Schema } = mongoose;

const schedJobTestSchema = new Schema({ ticTime: Date, message: String }, { collection: 'schedtest' });
mongoose.model('schedtest', schedJobTestSchema);