// app/models/license.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var moment = require('moment');

var LicenseSchema   = new Schema({
	email: {type:String, required:true},
	id: String,
	userid: String,
	appid: String,
	from: Date,
	to: Date,
	maxofflinetime: Number,
	trial: Boolean,
	datecreated: Date,
	active: Boolean
});

module.exports = mongoose.model('License', LicenseSchema);
