// app/models/activity.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ActivitySchema   = new Schema({
	userid: String,
	appid: String,
	licenseid: String,
	ip: String,
	geoloc: String,
	date: Date,
	machineid: String,
	operation: String
});

module.exports = mongoose.model('Activity', ActivitySchema);
