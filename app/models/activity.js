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

//Logging function
ActivitySchema.methods.log(ip, machineid, operation, userid, appid, licenseid)
{
	var activity = new Activity();
	activity.date = moment();
	activity.ip = ip;
	//activity.geoloc = TODO;
	activity.machineid = machineid;
	activity.operation = operation;
	activity.userid = userid;
	activity.appid = appid;
	activity.licenseid = licensid;
	
	activity.save(function(err) {
		if (err) console.log(err); 
	}
}


module.exports = mongoose.model('Activity', ActivitySchema);
