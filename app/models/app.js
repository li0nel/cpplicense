// app/models/app.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var AppSchema   = new Schema({
	id: String,
	ownerid: String,
	client_secret: String,
	description: String,
	datecreated: Date,
	active: Boolean
});

module.exports = mongoose.model('App', AppSchema);
