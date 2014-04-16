// app/models/license.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var LicenseSchema   = new Schema({
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
