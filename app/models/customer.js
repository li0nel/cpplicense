// app/models/user.js

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var CustomerSchema   = new Schema({
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	salt: { type: String, required: true },
	datecreated: Date,
	active: Boolean
});

CustomerSchema.pre('save', function(next) {
    var user = this;
	 
	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();
	
	console.log('new password (cleartext) : ' + user.password);
	 
	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);
	 
		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function(err, hash) {
			if (err) return next(err);
	 
			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model('Customer', CustomerSchema);
