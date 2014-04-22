// app/models/user.js

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var CustomerSchema   = new Schema({
	email: { type: String, required: true, index: { unique: true } },
	password: { type: String, required: true },
	id: { type: String, required: true, index: { unique: true } },
	oauthtoken: String,
	oauthtokenexpires: Date,
	forgottoken: String,
	forgottokenexpires: Date,
	datecreated: Date,
	active: Boolean
});

CustomerSchema.pre('save', function(next) {
    var customer = this;
	 
	// only hash the password if it has been modified (or is new)
	if (!customer.isModified('password')) return next();
	
	console.log('new password (cleartext) : ' + customer.password);
	 
	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if (err) return next(err);
	 
		// hash the password using our new salt
		bcrypt.hash(customer.password, salt, function(err, hash) {
			if (err) return next(err);
	 
			// override the cleartext password with the hashed one
			customer.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model('Customer', CustomerSchema);
