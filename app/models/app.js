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

AppSchema.methods.toJSON = function() {
  var obj = this.toObject()
  delete obj.client_secret;
  return obj;
}

module.exports = mongoose.model('App', AppSchema);
