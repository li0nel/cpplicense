// app/models/activity.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ActivitySchema   = new Schema({
	id: String,
	userid: String,
	appid: String,
	ip: String,
	timetamp: Date,
	machineid: String
});

module.exports = mongoose.model('Activity', ActivitySchema);
